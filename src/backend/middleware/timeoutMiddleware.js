const logger = require('../utils/logger');

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely and causing 503 errors
 * Based on Heroku's 30-second timeout limit
 */
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '25000', 10); // 25 seconds (5 seconds before Heroku's 30s limit)

/**
 * Middleware to set request timeout
 * Automatically sends 503 response if request takes too long
 */
const requestTimeout = (timeoutMs = REQUEST_TIMEOUT_MS) => {
  return (req, res, next) => {
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          path: req.path,
          timeout: `${timeoutMs}ms`,
          requestId: req.id
        });

        res.status(503).json({
          success: false,
          message: 'Request timeout - the server took too long to respond',
          requestId: req.id
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(...args) {
      clearTimeout(timeout);
      originalEnd.apply(this, args);
    };

    next();
  };
};

/**
 * Middleware to handle long-running operations
 * Wraps async route handlers to ensure they complete within timeout
 */
const withTimeout = (handler, timeoutMs = REQUEST_TIMEOUT_MS) => {
  return async (req, res, next) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      await Promise.race([
        Promise.resolve(handler(req, res, next)),
        timeoutPromise
      ]);
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.message.includes('timeout')) {
        if (!res.headersSent) {
          logger.error('Handler timeout', {
            method: req.method,
            path: req.path,
            timeout: `${timeoutMs}ms`,
            requestId: req.id
          });

          return res.status(503).json({
            success: false,
            message: 'Operation timeout - the request took too long to process',
            requestId: req.id
          });
        }
      } else {
        next(error);
      }
    }
  };
};

module.exports = {
  requestTimeout,
  withTimeout,
  REQUEST_TIMEOUT_MS
};

