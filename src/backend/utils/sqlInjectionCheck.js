const logger = require('./logger');

/**
 * SQL Injection Prevention
 * 
 * Note: Sequelize uses parameterized queries by default, which prevents SQL injection.
 * This utility provides additional checks and logging for suspicious patterns.
 */

// Common SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|#|\/\*|\*\/)/, // SQL comments
  /(;|\||&)/, // Command separators
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i, // Boolean-based injection (OR 1=1)
  /(['"]\s*(OR|AND)\s+['"]\d+['"]\s*=\s*['"]\d+['"])/i, // ' OR '1'='1' pattern
  /(OR|AND)\s+['"]1['"]\s*=\s*['"]1['"]/i, // OR '1'='1' (matches: OR '1'='1')
  /(OR|AND)\s+['"]\s*1\s*['"]\s*=\s*['"]\s*1\s*['"]/i, // OR ' 1 '=' 1 ' (more flexible with spaces)
  /['"](OR|AND)\s+['"]1['"]\s*=\s*['"]1['"]/i, // 'OR '1'='1' (matches: admin' OR '1'='1 - quote directly before OR)
  /(\b(OR|AND)\s+['"]\d+['"]\s*=\s*['"]\d+['"])/i, // OR '1'='1' pattern
  /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i, // Boolean-based injection with strings
  /(\bUNION\s+(ALL\s+)?SELECT)/i,
  /(CHAR|CHR|ASCII|CONCAT|SUBSTRING)/i, // SQL functions
  /(xp_|sp_)/i, // SQL Server procedures
  /(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)/i, // File operations
  /(['"]\s*(OR|AND)\s+['"]1['"]\s*=\s*['"]1['"])/i, // ' OR '1'='1' (more specific)
];

/**
 * Check if input contains SQL injection patterns
 * @param {any} input - Input to check
 * @param {string} fieldName - Field name for logging
 * @returns {boolean} - True if suspicious pattern detected
 */
function containsSQLInjection(input, fieldName = 'unknown') {
  if (!input || typeof input !== 'string') {
    return false;
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      logger.warn('Potential SQL injection attempt detected', {
        field: fieldName,
        pattern: pattern.toString(),
        inputLength: input.length,
        inputPreview: input.substring(0, 100)
      });
      return true;
    }
  }

  return false;
}

/**
 * Check request body for SQL injection patterns
 * @param {object} body - Request body
 * @param {string} ip - Client IP address
 * @returns {boolean} - True if suspicious pattern detected
 */
function checkRequestBody(body, ip) {
  if (!body || typeof body !== 'object') {
    return false;
  }

  let suspicious = false;

  function checkValue(value, key) {
    if (typeof value === 'string') {
      if (containsSQLInjection(value, key)) {
        suspicious = true;
        logger.warn('SQL injection attempt in request body', {
          field: key,
          ip: ip,
          timestamp: new Date().toISOString()
        });
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${key}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([k, v]) => {
        checkValue(v, `${key}.${k}`);
      });
    }
  }

  Object.entries(body).forEach(([key, value]) => {
    checkValue(value, key);
  });

  return suspicious;
}

/**
 * Middleware to log SQL injection attempts (Sequelize already prevents them)
 * This is for monitoring and alerting purposes only
 */
function sqlInjectionCheckMiddleware(req, res, next) {
  // Check query parameters
  if (req.query) {
    Object.entries(req.query).forEach(([key, value]) => {
      if (typeof value === 'string') {
        containsSQLInjection(value, `query.${key}`);
      }
    });
  }

  // Check URL parameters
  if (req.params) {
    Object.entries(req.params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        containsSQLInjection(value, `param.${key}`);
      }
    });
  }

  // Check request body
  if (req.body) {
    checkRequestBody(req.body, req.ip);
  }

  // Always continue - Sequelize will prevent actual SQL injection
  next();
}

module.exports = {
  containsSQLInjection,
  checkRequestBody,
  sqlInjectionCheckMiddleware
};

