const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.stack ? '\n' + info.stack : ''
    }${
      Object.keys(info).length > 3 ? '\n' + JSON.stringify(
        Object.fromEntries(
          Object.entries(info).filter(([key]) => 
            !['timestamp', 'level', 'message', 'stack'].includes(key)
          )
        ), 
        null, 
        2
      ) : ''
    }`
  )
);

// Production format with structured logging
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(), // Enable string interpolation
  winston.format.json(), // JSON format for log aggregation
  // Add metadata for structured logging
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log retention configuration (from environment or defaults)
const logRetentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
const logMaxSize = process.env.LOG_MAX_SIZE || '20m';
const logDatePattern = process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD';

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// Add file transports with rotation
if (process.env.NODE_ENV === 'production') {
  // Error log file with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: logDatePattern,
      level: 'error',
      format: productionFormat,
      maxSize: logMaxSize,
      maxFiles: `${logRetentionDays}d`, // Keep logs for specified days
      zippedArchive: true, // Compress old log files
      createSymlink: true, // Create symlink to latest log file
      symlinkName: 'error-current.log'
    })
  );

  // Combined log file with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: logDatePattern,
      format: productionFormat,
      maxSize: logMaxSize,
      maxFiles: `${logRetentionDays}d`, // Keep logs for specified days
      zippedArchive: true, // Compress old log files
      createSymlink: true, // Create symlink to latest log file
      symlinkName: 'combined-current.log'
    })
  );

  // Access log (HTTP requests) with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: logDatePattern,
      level: 'http',
      format: productionFormat,
      maxSize: logMaxSize,
      maxFiles: `${logRetentionDays}d`,
      zippedArchive: true,
      createSymlink: true,
      symlinkName: 'access-current.log'
    })
  );
} else {
  // Development: Simple file logging without rotation
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: developmentFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: developmentFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
    // Also log exceptions to file in production
    ...(process.env.NODE_ENV === 'production' ? [
      new DailyRotateFile({
        filename: path.join(logsDir, 'exceptions-%DATE%.log'),
        datePattern: logDatePattern,
        format: productionFormat,
        maxSize: logMaxSize,
        maxFiles: `${logRetentionDays}d`,
        zippedArchive: true,
      })
    ] : [])
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
    // Also log rejections to file in production
    ...(process.env.NODE_ENV === 'production' ? [
      new DailyRotateFile({
        filename: path.join(logsDir, 'rejections-%DATE%.log'),
        datePattern: logDatePattern,
        format: productionFormat,
        maxSize: logMaxSize,
        maxFiles: `${logRetentionDays}d`,
        zippedArchive: true,
      })
    ] : [])
  ],
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Add custom methods for structured logging
logger.logCommand = (commandType, commandId, data = {}) => {
  logger.info(`Command: ${commandType}`, {
    type: 'command',
    commandType,
    commandId,
    ...data
  });
};

logger.logEvent = (eventType, eventId, data = {}) => {
  logger.info(`Event: ${eventType}`, {
    type: 'event',
    eventType,
    eventId,
    ...data
  });
};

logger.logQuery = (queryType, queryId, data = {}) => {
  logger.debug(`Query: ${queryType}`, {
    type: 'query',
    queryType,
    queryId,
    ...data
  });
};

logger.logPerformance = (operation, duration, data = {}) => {
  logger.info(`Performance: ${operation}`, {
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    ...data
  });
};

logger.logSecurity = (event, severity = 'info', data = {}) => {
  logger[severity](`Security: ${event}`, {
    type: 'security',
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...data
  });
};

logger.logAudit = (action, userId, resource, data = {}) => {
  logger.info(`Audit: ${action}`, {
    type: 'audit',
    action,
    userId,
    resource,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Error handling for the logger itself
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

module.exports = logger;
