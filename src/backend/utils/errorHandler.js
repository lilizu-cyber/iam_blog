/**
 * Utility functions for safe error handling in production
 */

/**
 * Sanitize error message for client response
 * In production, returns generic message to prevent information disclosure
 * In development, returns actual error message for debugging
 * 
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message to show in production
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(error, defaultMessage = 'An error occurred') {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return defaultMessage;
  }
  
  return error?.message || defaultMessage;
}

/**
 * Get safe error response object
 * Never exposes stack traces or sensitive error details in production
 * 
 * @param {Error} error - The error object
 * @param {Object} options - Options for error response
 * @param {string} options.defaultMessage - Default message for production
 * @param {number} options.statusCode - HTTP status code (default: 500)
 * @param {string} options.requestId - Request ID for tracking
 * @returns {Object} Safe error response object
 */
function getSafeErrorResponse(error, options = {}) {
  const {
    defaultMessage = 'Internal server error',
    statusCode = 500,
    requestId = null
  } = options;
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response = {
    success: false,
    message: sanitizeErrorMessage(error, defaultMessage),
    ...(requestId && { requestId })
  };
  
  // Only include stack trace in development
  if (!isProduction && error?.stack) {
    response.stack = error.stack;
  }
  
  return {
    statusCode,
    body: response
  };
}

/**
 * Send safe error response
 * Helper function to send sanitized error responses
 * 
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {Object} options - Options for error response
 */
function sendSafeErrorResponse(res, error, options = {}) {
  const {
    defaultMessage = 'Internal server error',
    statusCode = 500,
    requestId = null
  } = options;
  
  const errorResponse = getSafeErrorResponse(error, {
    defaultMessage,
    statusCode,
    requestId
  });
  
  res.status(errorResponse.statusCode).json(errorResponse.body);
}

module.exports = {
  sanitizeErrorMessage,
  getSafeErrorResponse,
  sendSafeErrorResponse
};



