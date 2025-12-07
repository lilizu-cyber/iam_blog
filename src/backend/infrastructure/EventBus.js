const EventEmitter = require('events');
const logger = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
    this.projections = new Map();
    this.middlewares = [];
    this.setMaxListeners(100); // Increase max listeners for multiple projections
  }

  /**
   * Register an event handler
   * @param {string} eventType - The type of event
   * @param {Function} handler - The handler function
   * @param {Object} options - Handler options
   */
  registerHandler(eventType, handler, options = {}) {
    const { name = 'anonymous', priority = 0 } = options;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType);
    handlers.push({ handler, name, priority });
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);
    
    logger.info(`Registered event handler for: ${eventType}`, { name, priority });
  }

  /**
   * Register a projection (read model updater)
   * @param {string} projectionName - Name of the projection
   * @param {Array<string>} eventTypes - Event types this projection handles
   * @param {Function} projectionHandler - The projection handler function
   */
  registerProjection(projectionName, eventTypes, projectionHandler) {
    this.projections.set(projectionName, {
      eventTypes,
      handler: projectionHandler,
      isActive: true
    });

    // Register handlers for each event type
    eventTypes.forEach(eventType => {
      this.registerHandler(eventType, async (event) => {
        if (this.projections.get(projectionName)?.isActive) {
          await projectionHandler(event);
        }
      }, { name: `projection:${projectionName}`, priority: -1 });
    });

    logger.info(`Registered projection: ${projectionName}`, { eventTypes });
  }

  /**
   * Add middleware to the event pipeline
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Publish an event
   * @param {Object} event - The event to publish
   * @returns {Promise<void>}
   */
  async publish(event) {
    const { type } = event;
    
    if (!type) {
      throw new Error('Event must have a type property');
    }

    logger.info(`Publishing event: ${type}`, { 
      eventId: event.eventId,
      streamId: event.streamId 
    });

    try {
      // Execute middlewares
      let context = { event, metadata: {} };
      
      for (const middleware of this.middlewares) {
        context = await middleware(context);
      }

      // Get handlers for this event type
      const handlers = this.handlers.get(type) || [];
      
      if (handlers.length === 0) {
        logger.debug(`No handlers registered for event type: ${type}`);
        return;
      }

      // Execute all handlers
      const promises = handlers.map(async ({ handler, name }) => {
        try {
          await handler(context.event, context.metadata);
          logger.debug(`Event handler executed successfully: ${name}`, { eventType: type });
        } catch (error) {
          logger.error(`Event handler failed: ${name}`, {
            eventType: type,
            error: error.message,
            stack: error.stack
          });
          // Don't throw here - we want other handlers to continue
        }
      });

      await Promise.allSettled(promises);
      
      // Emit for any additional listeners
      this.emit(type, context.event);
      
      logger.info(`Event published successfully: ${type}`, { 
        eventId: event.eventId,
        handlerCount: handlers.length
      });

    } catch (error) {
      logger.error(`Event publishing failed: ${type}`, {
        eventId: event.eventId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Publish multiple events in sequence
   * @param {Array<Object>} events - Array of events to publish
   * @returns {Promise<void>}
   */
  async publishBatch(events) {
    logger.info(`Publishing batch of ${events.length} events`);
    
    for (const event of events) {
      await this.publish(event);
    }
    
    logger.info(`Batch publishing completed: ${events.length} events`);
  }

  /**
   * Get all registered event types
   * @returns {string[]} - Array of event types
   */
  getRegisteredEvents() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get all registered projections
   * @returns {Object} - Map of projection names to their details
   */
  getRegisteredProjections() {
    const projections = {};
    for (const [name, details] of this.projections) {
      projections[name] = {
        eventTypes: details.eventTypes,
        isActive: details.isActive
      };
    }
    return projections;
  }

  /**
   * Enable/disable a projection
   * @param {string} projectionName - Name of the projection
   * @param {boolean} isActive - Whether the projection should be active
   */
  setProjectionStatus(projectionName, isActive) {
    const projection = this.projections.get(projectionName);
    if (projection) {
      projection.isActive = isActive;
      logger.info(`Projection ${projectionName} ${isActive ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Remove all handlers for an event type
   * @param {string} eventType - The event type
   */
  unregisterHandlers(eventType) {
    const removed = this.handlers.delete(eventType);
    if (removed) {
      logger.info(`Unregistered all handlers for event type: ${eventType}`);
    }
    return removed;
  }

  /**
   * Remove a projection
   * @param {string} projectionName - Name of the projection to remove
   */
  unregisterProjection(projectionName) {
    const projection = this.projections.get(projectionName);
    if (projection) {
      // Remove handlers for each event type
      projection.eventTypes.forEach(eventType => {
        const handlers = this.handlers.get(eventType) || [];
        const filteredHandlers = handlers.filter(h => h.name !== `projection:${projectionName}`);
        if (filteredHandlers.length > 0) {
          this.handlers.set(eventType, filteredHandlers);
        } else {
          this.handlers.delete(eventType);
        }
      });
      
      this.projections.delete(projectionName);
      logger.info(`Unregistered projection: ${projectionName}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all handlers and projections
   */
  clear() {
    this.handlers.clear();
    this.projections.clear();
    this.middlewares = [];
    this.removeAllListeners();
    logger.info('Cleared all event handlers and projections');
  }
}

// Middleware for event validation
const eventValidationMiddleware = (validator) => {
  return async (context) => {
    const { event } = context;
    
    if (validator) {
      const { error, value } = validator.validate(event);
      if (error) {
        throw new Error(`Event validation failed: ${error.details[0].message}`);
      }
      context.event = value;
    }
    
    return context;
  };
};

// Middleware for event enrichment
const eventEnrichmentMiddleware = (enricher) => {
  return async (context) => {
    const { event } = context;
    
    if (enricher) {
      const enrichedEvent = await enricher(event);
      context.event = { ...event, ...enrichedEvent };
    }
    
    return context;
  };
};

// Middleware for event logging
const eventLoggingMiddleware = () => {
  return async (context) => {
    const { event } = context;
    
    logger.debug('Event middleware - processing event', {
      type: event.type,
      eventId: event.eventId,
      streamId: event.streamId,
      timestamp: new Date().toISOString()
    });
    
    return context;
  };
};

module.exports = {
  EventBus,
  eventValidationMiddleware,
  eventEnrichmentMiddleware,
  eventLoggingMiddleware
};
