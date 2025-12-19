const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize = null;

function initializeSequelize(connectionString) {
  if (sequelize) {
    return sequelize;
  }

  // Validate connection string before creating Sequelize instance
  if (!connectionString) {
    logger.error('initializeSequelize: connectionString is undefined or null');
    throw new Error('Database connection string is undefined. Please set POSTGRESQL_URI environment variable in Railway.');
  }
  
  if (typeof connectionString !== 'string') {
    logger.error('initializeSequelize: connectionString is not a string', {
      type: typeof connectionString
    });
    throw new Error(`Database connection string must be a string. Got: ${typeof connectionString}`);
  }
  
  if (connectionString.trim() === '') {
    logger.error('initializeSequelize: connectionString is empty');
    throw new Error('Database connection string is empty. Please set POSTGRESQL_URI environment variable in Railway.');
  }
  
  logger.debug('initializeSequelize: Creating Sequelize instance', {
    uriLength: connectionString.length,
    uriPreview: connectionString.substring(0, 30) + '...'
  });

  // Connection pool configuration
  // Can be overridden via environment variables
  const poolConfig = {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),        // Maximum number of connections in pool
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),        // Minimum number of connections in pool (maintains warm connections)
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10), // Maximum time (ms) to wait for connection before throwing error
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)   // Maximum time (ms) a connection can be idle before being released
  };

  // Wrap Sequelize instantiation to catch parsing errors
  try {
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: false, // Set to logger.debug for SQL logging
      define: {
        underscored: true, // Use snake_case for column names (authorId -> author_id)
        freezeTableName: true // Don't pluralize table names
      },
      pool: poolConfig
    });
  } catch (sequelizeError) {
    logger.error('Failed to create Sequelize instance in initializeSequelize:', {
      error: sequelizeError.message,
      stack: sequelizeError.stack,
      connectionStringLength: connectionString ? connectionString.length : 0,
      connectionStringPreview: connectionString ? connectionString.substring(0, 50) : 'undefined'
    });
    throw new Error(
      `Failed to initialize Sequelize with connection string. ` +
      `This usually means POSTGRESQL_URI is not set or is invalid. ` +
      `Original error: ${sequelizeError.message}`
    );
  }

  return sequelize;
}

function getSequelize() {
  if (!sequelize) {
    throw new Error('Sequelize not initialized. Call initializeSequelize first.');
  }
  return sequelize;
}

// Export models (will be available after Sequelize is initialized)
const getModels = () => {
  if (!sequelize) {
    throw new Error('Sequelize not initialized. Call initializeSequelize first.');
  }
  return {
    User: require('./User'),
    BlogPost: require('./BlogPost'),
    NewsletterSubscription: require('./NewsletterSubscription'),
    ContactMessage: require('./ContactMessage')
  };
};

module.exports = {
  initializeSequelize,
  getSequelize,
  Sequelize,
  getModels
};

