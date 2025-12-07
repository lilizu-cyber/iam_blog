const performanceMonitor = require('../middleware/performanceMonitor');
const apmIntegrations = require('./apmIntegrations');
const logger = require('./logger');

/**
 * Database query monitoring wrapper
 * Tracks database query performance
 */
class DatabaseMonitor {
  /**
   * Wrap Sequelize query execution
   */
  static wrapQuery(sequelize) {
    const originalQuery = sequelize.query.bind(sequelize);

    sequelize.query = function(sql, options) {
      const startTime = Date.now();
      const queryString = typeof sql === 'string' ? sql : sql.query || 'N/A';

      return originalQuery(sql, options)
        .then((result) => {
          const duration = Date.now() - startTime;
          
          // Track in performance monitor
          performanceMonitor.recordDatabaseQuery(duration, queryString);

          // Track in APM
          apmIntegrations.trackDatabaseQuery(queryString, duration);

          // Log slow queries
          if (duration > 1000) {
            logger.warn('Slow database query', {
              duration: `${duration}ms`,
              query: queryString.substring(0, 200)
            });
          }

          return result;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;
          
          // Track error
          performanceMonitor.recordDatabaseQuery(duration, queryString);
          apmIntegrations.trackDatabaseQuery(queryString, duration, error);

          throw error;
        });
    };

    return sequelize;
  }

  /**
   * Wrap Sequelize model methods
   */
  static wrapModel(Model) {
    const methods = ['findAll', 'findOne', 'findByPk', 'create', 'update', 'destroy', 'count'];

    methods.forEach(method => {
      if (typeof Model[method] === 'function') {
        const originalMethod = Model[method].bind(Model);

        Model[method] = function(...args) {
          const startTime = Date.now();
          const modelName = Model.name || Model.tableName || 'Unknown';

          return originalMethod(...args)
            .then((result) => {
              const duration = Date.now() - startTime;
              
              // Track in performance monitor
              performanceMonitor.recordDatabaseQuery(duration, `${modelName}.${method}`);

              // Track in APM
              apmIntegrations.trackDatabaseQuery(`${modelName}.${method}`, duration);

              return result;
            })
            .catch((error) => {
              const duration = Date.now() - startTime;
              
              // Track error
              performanceMonitor.recordDatabaseQuery(duration, `${modelName}.${method}`);
              apmIntegrations.trackDatabaseQuery(`${modelName}.${method}`, duration, error);

              throw error;
            });
        };
      }
    });

    return Model;
  }
}

module.exports = DatabaseMonitor;

