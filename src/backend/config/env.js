const logger = require('../utils/logger');

/**
 * Environment variable validation and configuration
 * Validates required environment variables on startup
 */

// Required environment variables (must be set)
// Note: POSTGRESQL_URI or DATABASE_URL (either one is acceptable)
const requiredEnvVars = [
  'JWT_SECRET'
];

// Database connection - either POSTGRESQL_URI or DATABASE_URL must be set
const databaseEnvVars = ['POSTGRESQL_URI', 'DATABASE_URL'];

// Required in production only (can have defaults in development)
const productionRequiredEnvVars = [
  'NODE_ENV',
  'FRONTEND_URL'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: '12',
  MAX_FILE_SIZE: '5242880',
  UPLOAD_PATH: './uploads'
};

/**
 * Validates required environment variables
 * @throws {Error} If any required variable is missing
 */
function validateRequiredEnvVars() {
  const missing = [];
  
  // Check required vars
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });
  
  // Check database connection (either POSTGRESQL_URI or DATABASE_URL)
  const hasDatabaseUri = databaseEnvVars.some(varName => 
    process.env[varName] && process.env[varName].trim() !== ''
  );
  
  if (!hasDatabaseUri) {
    missing.push('POSTGRESQL_URI or DATABASE_URL');
  }
  
  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your .env file.`
    );
    logger.error('Environment variable validation failed:', error.message);
    throw error;
  }
}

/**
 * Validates production-specific requirements
 * @throws {Error} If in production and required vars are missing
 */
function validateProductionEnvVars() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    // In development, use defaults for optional vars
    productionRequiredEnvVars.forEach(varName => {
      if (!process.env[varName] && optionalEnvVars[varName]) {
        process.env[varName] = optionalEnvVars[varName];
        logger.debug(`Using default value for ${varName}: ${optionalEnvVars[varName]}`);
      }
    });
    return;
  }
  
  // In production, these are required
  const missing = [];
  
  productionRequiredEnvVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables for production: ${missing.join(', ')}\n` +
      `These must be set when NODE_ENV=production`
    );
    logger.error('Production environment variable validation failed:', error.message);
    throw error;
  }
}

/**
 * Validates environment variable values
 * @throws {Error} If any variable has an invalid value
 */
function validateEnvVarValues() {
  const errors = [];
  
  // Validate NODE_ENV
  if (process.env.NODE_ENV && 
      !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: development, production, test. Got: ${process.env.NODE_ENV}`);
  }
  
  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`PORT must be a number between 1 and 65535. Got: ${process.env.PORT}`);
    }
  }
  
  // Validate FRONTEND_URL format
  if (process.env.FRONTEND_URL) {
    try {
      new URL(process.env.FRONTEND_URL);
    } catch (e) {
      errors.push(`FRONTEND_URL must be a valid URL. Got: ${process.env.FRONTEND_URL}`);
    }
  }
  
  // Validate database URI format (check both POSTGRESQL_URI and DATABASE_URL)
  const dbUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  if (dbUri) {
    if (!dbUri.startsWith('postgresql://') && 
        !dbUri.startsWith('postgres://')) {
      errors.push(`Database URI (POSTGRESQL_URI or DATABASE_URL) must start with 'postgresql://' or 'postgres://'`);
    }
  }
  
  if (errors.length > 0) {
    const error = new Error(
      `Invalid environment variable values:\n${errors.join('\n')}`
    );
    logger.error('Environment variable value validation failed:', error.message);
    throw error;
  }
}

/**
 * Validates all environment variables on startup
 * Should be called during server initialization
 * @throws {Error} If validation fails
 */
function validateEnvVars() {
  try {
    logger.info('Validating environment variables...');
    
    // Set defaults for optional vars if not set
    Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
      if (!process.env[key]) {
        process.env[key] = defaultValue;
      }
    });
    
    // Validate required vars
    validateRequiredEnvVars();
    
    // Validate production-specific vars
    validateProductionEnvVars();
    
    // Validate values
    validateEnvVarValues();
    
    logger.info('Environment variable validation passed');
    
    // Log configuration (without sensitive values)
    logger.debug('Environment configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      FRONTEND_URL: process.env.FRONTEND_URL,
      POSTGRESQL_URI: (process.env.POSTGRESQL_URI || process.env.DATABASE_URL) ? 
        (process.env.POSTGRESQL_URI || process.env.DATABASE_URL).replace(/:[^:@]+@/, ':****@') : 'not set',
      JWT_SECRET: process.env.JWT_SECRET ? 
        `set (${process.env.JWT_SECRET.length} chars)` : 'not set'
    });
    
  } catch (error) {
    logger.error('Environment variable validation failed:', error.message);
    logger.error('Server cannot start without proper environment configuration');
    logger.error('Please check your .env file and ensure all required variables are set');
    throw error;
  }
}

/**
 * Gets a validated environment variable value
 * @param {string} varName - Environment variable name
 * @param {string} defaultValue - Default value if not set (optional)
 * @returns {string} Environment variable value
 */
function getEnvVar(varName, defaultValue = null) {
  const value = process.env[varName];
  
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${varName} is not set and no default provided`);
  }
  
  return value || defaultValue;
}

module.exports = {
  validateEnvVars,
  getEnvVar,
  requiredEnvVars,
  productionRequiredEnvVars,
  optionalEnvVars,
  databaseEnvVars
};

