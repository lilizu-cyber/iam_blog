const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize = null;

function initializeSequelize(connectionString) {
  if (sequelize) {
    return sequelize;
  }

  // Connection pool configuration
  // Can be overridden via environment variables
  const poolConfig = {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),        // Maximum number of connections in pool
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),        // Minimum number of connections in pool (maintains warm connections)
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10), // Maximum time (ms) to wait for connection before throwing error
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)   // Maximum time (ms) a connection can be idle before being released
  };

  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    logging: false, // Set to logger.debug for SQL logging
    define: {
      underscored: true, // Use snake_case for column names (authorId -> author_id)
      freezeTableName: true // Don't pluralize table names
    },
    pool: poolConfig
  });

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

