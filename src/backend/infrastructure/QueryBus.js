const logger = require('../utils/logger');

class QueryBus {
  constructor() {
    this.handlers = new Map();
    this.middlewares = [];
  }

  /**
   * Register a query handler
   * @param {string} queryType - The type of query
   * @param {Function} handler - The handler function
   */
  registerHandler(queryType, handler) {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler for query type '${queryType}' is already registered`);
    }
    
    this.handlers.set(queryType, handler);
    logger.info(`Registered query handler for: ${queryType}`);
  }

  /**
   * Add middleware to the query pipeline
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Execute a query
   * @param {Object} query - The query to execute
   * @returns {Promise<any>} - The result of query execution
   */
  async execute(query) {
    const { type } = query;
    
    if (!type) {
      throw new Error('Query must have a type property');
    }

    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for query type: ${type}`);
    }

    logger.debug(`Executing query: ${type}`, { queryId: query.id });

    try {
      // Execute middlewares
      let context = { query, metadata: {} };
      
      for (const middleware of this.middlewares) {
        context = await middleware(context);
      }

      // Execute the query handler
      const result = await handler(context.query, context.metadata);
      
      logger.debug(`Query executed successfully: ${type}`, { 
        queryId: query.id,
        resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
      });

      return result;
    } catch (error) {
      logger.error(`Query execution failed: ${type}`, {
        queryId: query.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get all registered query types
   * @returns {string[]} - Array of query types
   */
  getRegisteredQueries() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a query handler is registered
   * @param {string} queryType - The query type to check
   * @returns {boolean} - True if handler exists
   */
  hasHandler(queryType) {
    return this.handlers.has(queryType);
  }

  /**
   * Unregister a query handler
   * @param {string} queryType - The query type to unregister
   */
  unregisterHandler(queryType) {
    const removed = this.handlers.delete(queryType);
    if (removed) {
      logger.info(`Unregistered query handler for: ${queryType}`);
    }
    return removed;
  }

  /**
   * Clear all handlers and middlewares
   */
  clear() {
    this.handlers.clear();
    this.middlewares = [];
    logger.info('Cleared all query handlers and middlewares');
  }
}

// Middleware for caching
const cacheMiddleware = (cacheService) => {
  return async (context) => {
    const { query } = context;
    
    if (query.useCache !== false) {
      const cacheKey = `query:${query.type}:${JSON.stringify(query.parameters || {})}`;
      const cachedResult = await cacheService.get(cacheKey);
      
      if (cachedResult) {
        logger.debug(`Cache hit for query: ${query.type}`, { cacheKey });
        context.cachedResult = cachedResult;
        return context;
      }
      
      context.cacheKey = cacheKey;
    }
    
    return context;
  };
};

// Middleware for query validation
const queryValidationMiddleware = (validator) => {
  return async (context) => {
    const { query } = context;
    
    if (validator) {
      const { error, value } = validator.validate(query);
      if (error) {
        throw new Error(`Query validation failed: ${error.details[0].message}`);
      }
      context.query = value;
    }
    
    return context;
  };
};

// Middleware for authentication (read permissions)
const queryAuthMiddleware = (authService) => {
  return async (context) => {
    const { query } = context;
    
    if (query.userId) {
      const user = await authService.validateUser(query.userId);
      if (!user) {
        throw new Error('Invalid user authentication');
      }
      context.metadata.user = user;
    }
    
    return context;
  };
};

// Middleware for performance monitoring
const performanceMiddleware = () => {
  return async (context) => {
    const { query } = context;
    
    context.startTime = Date.now();
    logger.debug('Query performance - starting execution', {
      type: query.type,
      id: query.id,
      timestamp: new Date().toISOString()
    });
    
    return context;
  };
};

// Post-execution middleware for caching results
const cacheResultMiddleware = (cacheService, ttl = 300) => {
  return async (context, result) => {
    if (context.cacheKey && result && !context.cachedResult) {
      await cacheService.set(context.cacheKey, result, ttl);
      logger.debug(`Cached query result: ${context.query.type}`, { 
        cacheKey: context.cacheKey,
        ttl 
      });
    }
    
    if (context.startTime) {
      const duration = Date.now() - context.startTime;
      logger.debug('Query performance - execution completed', {
        type: context.query.type,
        duration: `${duration}ms`,
        cached: !!context.cachedResult
      });
    }
    
    return result;
  };
};

module.exports = {
  QueryBus,
  cacheMiddleware,
  queryValidationMiddleware,
  queryAuthMiddleware,
  performanceMiddleware,
  cacheResultMiddleware
};
