const { EventStoreDBClient, jsonEvent } = require('@eventstore/db-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class EventStore {
  constructor(connectionString) {
    this.client = EventStoreDBClient.connectionString(connectionString);
    this.isConnected = false;
  }

  async connect() {
    try {
      // Test connection by reading server info
      await this.client.readAll({ direction: 'backwards', maxCount: 1 });
      this.isConnected = true;
      logger.info('Connected to EventStore');
    } catch (error) {
      logger.error('Failed to connect to EventStore:', error);
      throw error;
    }
  }

  async appendToStream(streamName, events, expectedRevision = 'any') {
    try {
      const eventData = events.map(event => 
        jsonEvent({
          type: event.type,
          data: event.data,
          metadata: {
            ...event.metadata,
            timestamp: new Date().toISOString(),
            eventId: uuidv4()
          }
        })
      );

      const result = await this.client.appendToStream(
        streamName,
        eventData,
        { expectedRevision }
      );

      logger.info(`Events appended to stream ${streamName}:`, {
        streamName,
        eventCount: events.length,
        revision: result.nextExpectedRevision
      });

      return result;
    } catch (error) {
      logger.error(`Failed to append events to stream ${streamName}:`, error);
      throw error;
    }
  }

  async readStream(streamName, options = {}) {
    try {
      const {
        direction = 'forwards',
        fromRevision = 'start',
        maxCount = 1000
      } = options;

      const events = [];
      const eventStream = this.client.readStream(streamName, {
        direction,
        fromRevision,
        maxCount
      });

      for await (const event of eventStream) {
        events.push({
          eventId: event.event.id,
          eventType: event.event.type,
          data: event.event.data,
          metadata: event.event.metadata,
          streamId: event.event.streamId,
          revision: event.event.revision,
          created: event.event.created
        });
      }

      return events;
    } catch (error) {
      if (error.type === 'stream-not-found') {
        return [];
      }
      logger.error(`Failed to read stream ${streamName}:`, error);
      throw error;
    }
  }

  async readAllEvents(options = {}) {
    try {
      const {
        direction = 'forwards',
        fromPosition = 'start',
        maxCount = 1000
      } = options;

      const events = [];
      const eventStream = this.client.readAll({
        direction,
        fromPosition,
        maxCount
      });

      for await (const event of eventStream) {
        events.push({
          eventId: event.event.id,
          eventType: event.event.type,
          data: event.event.data,
          metadata: event.event.metadata,
          streamId: event.event.streamId,
          revision: event.event.revision,
          created: event.event.created,
          position: event.event.position
        });
      }

      return events;
    } catch (error) {
      logger.error('Failed to read all events:', error);
      throw error;
    }
  }

  async subscribeToStream(streamName, eventHandler, options = {}) {
    try {
      const subscription = this.client.subscribeToStream(streamName, options);
      
      subscription.on('data', async (event) => {
        try {
          await eventHandler({
            eventId: event.event.id,
            eventType: event.event.type,
            data: event.event.data,
            metadata: event.event.metadata,
            streamId: event.event.streamId,
            revision: event.event.revision,
            created: event.event.created
          });
        } catch (error) {
          logger.error('Error in event handler:', error);
        }
      });

      subscription.on('error', (error) => {
        logger.error(`Subscription error for stream ${streamName}:`, error);
      });

      subscription.on('close', () => {
        logger.info(`Subscription closed for stream ${streamName}`);
      });

      logger.info(`Subscribed to stream: ${streamName}`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to subscribe to stream ${streamName}:`, error);
      throw error;
    }
  }

  async subscribeToAll(eventHandler, options = {}) {
    try {
      const subscription = this.client.subscribeToAll(options);
      
      subscription.on('data', async (event) => {
        try {
          await eventHandler({
            eventId: event.event.id,
            eventType: event.event.type,
            data: event.event.data,
            metadata: event.event.metadata,
            streamId: event.event.streamId,
            revision: event.event.revision,
            created: event.event.created,
            position: event.event.position
          });
        } catch (error) {
          logger.error('Error in event handler:', error);
        }
      });

      subscription.on('error', (error) => {
        logger.error('Subscription error for all events:', error);
      });

      subscription.on('close', () => {
        logger.info('Subscription closed for all events');
      });

      logger.info('Subscribed to all events');
      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to all events:', error);
      throw error;
    }
  }

  async createProjection(name, query) {
    try {
      await this.client.createProjection(name, query);
      logger.info(`Created projection: ${name}`);
    } catch (error) {
      logger.error(`Failed to create projection ${name}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.dispose();
      this.isConnected = false;
      logger.info('Disconnected from EventStore');
    }
  }
}

module.exports = EventStore;
