const logger = require('./logger');

/**
 * Validates and returns the JWT secret from environment variables
 * Throws an error if not properly configured
 * @returns {string} The JWT secret
 * @throws {Error} If JWT_SECRET is not set or is invalid
 */
function getJWTSecret() {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    const error = new Error('JWT_SECRET environment variable is required and must be set');
    logger.error('JWT_SECRET validation failed:', error.message);
    throw error;
  }
  
  if (JWT_SECRET === 'your-super-secret-jwt-key-change-in-production' || 
      JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    const error = new Error('JWT_SECRET must be changed from the default value. Use a strong, random secret (minimum 32 characters)');
    logger.error('JWT_SECRET validation failed:', error.message);
    throw error;
  }
  
  if (JWT_SECRET.length < 32) {
    const error = new Error(`JWT_SECRET must be at least 32 characters long. Current length: ${JWT_SECRET.length}`);
    logger.error('JWT_SECRET validation failed:', error.message);
    throw error;
  }
  
  logger.debug('JWT_SECRET validated successfully', { length: JWT_SECRET.length });
  return JWT_SECRET;
}

/**
 * Validates JWT_SECRET on startup
 * Should be called during server initialization
 */
function validateJWTSecretOnStartup() {
  try {
    getJWTSecret();
    logger.info('JWT_SECRET validation passed');
  } catch (error) {
    logger.error('JWT_SECRET validation failed on startup:', error.message);
    logger.error('Server cannot start without a valid JWT_SECRET');
    logger.error('Please set JWT_SECRET in your .env file with a strong, random value (minimum 32 characters)');
    throw error;
  }
}

module.exports = {
  getJWTSecret,
  validateJWTSecretOnStartup
};


