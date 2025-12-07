const logger = require('../utils/logger');

class CommandBus {
  constructor() {
    this.handlers = new Map();
    this.middlewares = [];
  }

  /**
   * Register a command handler
   * @param {string} commandType - The type of command
   * @param {Function} handler - The handler function
   */
  registerHandler(commandType, handler) {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler for command type '${commandType}' is already registered`);
    }
    
    this.handlers.set(commandType, handler);
    logger.info(`Registered command handler for: ${commandType}`);
  }

  /**
   * Add middleware to the command pipeline
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Execute a command
   * @param {Object} command - The command to execute
   * @returns {Promise<any>} - The result of command execution
   */
  async execute(command) {
    const { type } = command;
    
    if (!type) {
      throw new Error('Command must have a type property');
    }

    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${type}`);
    }

    logger.info(`Executing command: ${type}`, { commandId: command.id });

    try {
      // Execute middlewares
      let context = { command, metadata: {} };
      
      for (const middleware of this.middlewares) {
        context = await middleware(context);
      }

      // Execute the command handler
      const result = await handler(context.command, context.metadata);
      
      logger.info(`Command executed successfully: ${type}`, { 
        commandId: command.id,
        result: result ? 'success' : 'no result'
      });

      return result;
    } catch (error) {
      logger.error(`Command execution failed: ${type}`, {
        commandId: command.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get all registered command types
   * @returns {string[]} - Array of command types
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a command handler is registered
   * @param {string} commandType - The command type to check
   * @returns {boolean} - True if handler exists
   */
  hasHandler(commandType) {
    return this.handlers.has(commandType);
  }

  /**
   * Unregister a command handler
   * @param {string} commandType - The command type to unregister
   */
  unregisterHandler(commandType) {
    const removed = this.handlers.delete(commandType);
    if (removed) {
      logger.info(`Unregistered command handler for: ${commandType}`);
    }
    return removed;
  }

  /**
   * Clear all handlers and middlewares
   */
  clear() {
    this.handlers.clear();
    this.middlewares = [];
    logger.info('Cleared all command handlers and middlewares');
  }
}

// Middleware for validation
const validationMiddleware = (validator) => {
  return async (context) => {
    const { command } = context;
    
    if (validator) {
      const { error, value } = validator.validate(command);
      if (error) {
        throw new Error(`Command validation failed: ${error.details[0].message}`);
      }
      context.command = value;
    }
    
    return context;
  };
};

// Middleware for authentication
const authenticationMiddleware = (authService) => {
  return async (context) => {
    const { command } = context;
    
    if (command.userId) {
      const user = await authService.validateUser(command.userId);
      if (!user) {
        throw new Error('Invalid user authentication');
      }
      context.metadata.user = user;
    }
    
    return context;
  };
};

// Middleware for authorization
const authorizationMiddleware = (permissions) => {
  return async (context) => {
    const { command, metadata } = context;
    
    if (permissions && metadata.user) {
      const hasPermission = await permissions.check(metadata.user, command.type);
      if (!hasPermission) {
        throw new Error(`User does not have permission to execute command: ${command.type}`);
      }
    }
    
    return context;
  };
};

// Middleware for logging
const loggingMiddleware = () => {
  return async (context) => {
    const { command } = context;
    
    logger.debug('Command middleware - processing command', {
      type: command.type,
      id: command.id,
      timestamp: new Date().toISOString()
    });
    
    return context;
  };
};

module.exports = {
  CommandBus,
  validationMiddleware,
  authenticationMiddleware,
  authorizationMiddleware,
  loggingMiddleware
};
