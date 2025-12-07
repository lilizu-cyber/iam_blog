const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PostgresEventStore {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.sequelize = null;
    this.EventModel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Connection pool configuration
      // Can be overridden via environment variables
      const poolConfig = {
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),        // Maximum number of connections in pool
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),        // Minimum number of connections in pool (maintains warm connections)
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10), // Maximum time (ms) to wait for connection before throwing error
        idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)   // Maximum time (ms) a connection can be idle before being released
      };

      this.sequelize = new Sequelize(this.connectionString, {
        dialect: 'postgres',
        logging: false, // Set to logger.debug for SQL logging
        define: {
          underscored: true,
          freezeTableName: true
        },
        pool: poolConfig
      });

      // Define Event model
      // With underscored: true, Sequelize converts camelCase to snake_case automatically
      this.EventModel = this.sequelize.define('Event', {
        eventId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        streamId: {
          type: DataTypes.STRING,
          allowNull: false
        },
        eventType: {
          type: DataTypes.STRING,
          allowNull: false
        },
        eventNumber: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        data: {
          type: DataTypes.JSONB,
          allowNull: false
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        },
        timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      }, {
        tableName: 'events',
        timestamps: false,
        underscored: true, // Converts camelCase to snake_case
        // Note: For indexes, we need to use the actual DB column names (snake_case)
        // because Sequelize creates indexes after table creation
        indexes: [
          {
            unique: true,
            fields: ['stream_id', 'event_number'] // Use actual DB column names
          },
          {
            fields: ['stream_id']
          },
          {
            fields: ['event_type']
          },
          {
            fields: ['timestamp']
          }
        ]
      });

      // Sync model only in development
      // In production, use migrations (run: npm run migrate:up)
      await this.sequelize.authenticate();
      
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Development mode: syncing event store (use migrations in production)');
        await this.EventModel.sync({ alter: false });
      } else {
        logger.info('Production mode: skipping event store sync (use migrations)');
        // In production, verify table exists
        try {
          await this.sequelize.query('SELECT 1 FROM events LIMIT 1');
          logger.info('Event store table exists');
        } catch (error) {
          logger.error('Event store table missing. Please run migrations: npm run migrate:up');
          throw new Error('Event store table not found. Run migrations first.');
        }
      }
      
      this.isConnected = true;
      logger.info('Connected to PostgreSQL Event Store');
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL Event Store:', error);
      throw error;
    }
  }

  /**
   * Health check for Event Store
   */
  async healthCheck() {
    const startTime = Date.now();
    try {
      if (!this.sequelize) {
        return {
          status: 'unhealthy',
          error: 'EventStore not initialized',
          responseTime: Date.now() - startTime
        };
      }

      // Test connection
      await this.sequelize.authenticate();
      
      // Test with a simple query
      const [results] = await this.sequelize.query('SELECT COUNT(*) as count FROM events LIMIT 1');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          database: this.sequelize.getDatabaseName(),
          host: this.sequelize.config.host,
          port: this.sequelize.config.port,
          eventCount: results[0]?.count || 0
        }
      };
    } catch (error) {
      logger.error('EventStore health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async appendToStream(streamName, events, expectedRevision = 'any') {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Get current stream revision (use property names, Sequelize converts to snake_case)
      const lastEvent = await this.EventModel.findOne({
        where: { streamId: streamName },
        order: [['eventNumber', 'DESC']],
        transaction
      });

      const currentRevision = lastEvent ? lastEvent.eventNumber : -1;

      // Check expected revision
      if (expectedRevision !== 'any' && expectedRevision !== currentRevision) {
        await transaction.rollback();
        throw new Error(`Expected revision ${expectedRevision}, but stream is at revision ${currentRevision}`);
      }

      // Prepare events for insertion (using camelCase - Sequelize will convert to snake_case)
      const eventsToInsert = events.map((event, index) => ({
        eventId: event.eventId || uuidv4(),
        streamId: streamName,
        eventType: event.type,
        eventNumber: currentRevision + 1 + index,
        data: event.data,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          eventId: event.eventId || uuidv4()
        },
        timestamp: new Date()
      }));

      // Insert events in transaction
      await this.EventModel.bulkCreate(eventsToInsert, { transaction });

      await transaction.commit();

      const result = {
        nextExpectedRevision: currentRevision + events.length,
        events: eventsToInsert
      };

      logger.info(`Events appended to stream ${streamName}:`, {
        streamName,
        eventCount: events.length,
        revision: result.nextExpectedRevision
      });

      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Failed to append events to stream ${streamName}:`, error);
      throw error;
    }
  }

  async readStream(streamName, options = {}) {
    try {
      const {
        direction = 'forwards',
        fromRevision = 0,
        maxCount = 1000
      } = options;

      const where = { streamId: streamName };
      
      if (fromRevision > 0) {
        where.eventNumber = direction === 'forwards' 
          ? { [Sequelize.Op.gte]: fromRevision }
          : { [Sequelize.Op.lte]: fromRevision };
      }

      const order = direction === 'forwards' 
        ? [['eventNumber', 'ASC']]
        : [['eventNumber', 'DESC']];

      const events = await this.EventModel.findAll({
        where,
        order,
        limit: maxCount,
        raw: true
      });

      // Sequelize returns snake_case when using raw: true, but we want camelCase
      return events.map(event => ({
        eventId: event.event_id || event.eventId,
        eventType: event.event_type || event.eventType,
        data: event.data,
        metadata: event.metadata,
        streamId: event.stream_id || event.streamId,
        revision: event.event_number || event.eventNumber,
        created: event.timestamp
      }));
    } catch (error) {
      logger.error(`Failed to read stream ${streamName}:`, error);
      throw error;
    }
  }

  async readAllEvents(options = {}) {
    try {
      const {
        direction = 'forwards',
        maxCount = 1000
      } = options;

      const order = direction === 'forwards' 
        ? [['timestamp', 'ASC']]
        : [['timestamp', 'DESC']];

      const events = await this.EventModel.findAll({
        order,
        limit: maxCount,
        raw: true
      });

      return events.map(event => ({
        eventId: event.event_id || event.eventId,
        eventType: event.event_type || event.eventType,
        data: event.data,
        metadata: event.metadata,
        streamId: event.stream_id || event.streamId,
        revision: event.event_number || event.eventNumber,
        created: event.timestamp,
        position: event.event_id || event.eventId
      }));
    } catch (error) {
      logger.error('Failed to read all events:', error);
      throw error;
    }
  }

  async getStreamRevision(streamName) {
    try {
      const lastEvent = await this.EventModel.findOne({
        where: { streamId: streamName },
        order: [['eventNumber', 'DESC']],
        attributes: ['eventNumber'],
        raw: true
      });

      return lastEvent ? (lastEvent.event_number || lastEvent.eventNumber) : -1;
    } catch (error) {
      logger.error(`Failed to get stream revision for ${streamName}:`, error);
      throw error;
    }
  }

  async subscribeToStream(streamName, eventHandler, options = {}) {
    // Polling-based subscription
    const pollInterval = options.pollInterval || 1000;
    let lastProcessedRevision = -1;

    const poll = async () => {
      try {
        const events = await this.readStream(streamName, {
          fromRevision: lastProcessedRevision + 1,
          maxCount: 100
        });

        for (const event of events) {
          await eventHandler(event);
          lastProcessedRevision = event.revision;
        }
      } catch (error) {
        logger.error(`Subscription error for stream ${streamName}:`, error);
      }
    };

    const intervalId = setInterval(poll, pollInterval);
    
    logger.info(`Subscribed to stream: ${streamName}`);
    
    return {
      stop: () => {
        clearInterval(intervalId);
        logger.info(`Subscription stopped for stream: ${streamName}`);
      }
    };
  }

  async subscribeToAll(eventHandler, options = {}) {
    const pollInterval = options.pollInterval || 1000;
    let lastProcessedTimestamp = new Date(0);

    const poll = async () => {
      try {
        const events = await this.EventModel.findAll({
          where: {
            timestamp: { [Sequelize.Op.gt]: lastProcessedTimestamp }
          },
          order: [['timestamp', 'ASC']],
          limit: 100,
          raw: true
        });

        for (const event of events) {
          await eventHandler({
            eventId: event.event_id || event.eventId,
            eventType: event.event_type || event.eventType,
            data: event.data,
            metadata: event.metadata,
            streamId: event.stream_id || event.streamId,
            revision: event.event_number || event.eventNumber,
            created: event.timestamp,
            position: event.event_id || event.eventId
          });
          lastProcessedTimestamp = event.timestamp;
        }
      } catch (error) {
        logger.error('Subscription error for all events:', error);
      }
    };

    const intervalId = setInterval(poll, pollInterval);
    
    logger.info('Subscribed to all events');
    
    return {
      stop: () => {
        clearInterval(intervalId);
        logger.info('Subscription stopped for all events');
      }
    };
  }

  async disconnect() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      logger.info('Disconnected from PostgreSQL Event Store');
    }
  }
}

module.exports = PostgresEventStore;

