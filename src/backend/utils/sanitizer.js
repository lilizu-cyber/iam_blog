const logger = require('./logger');

// Initialize DOMPurify
let DOMPurify;
try {
  // isomorphic-dompurify automatically handles Node.js environment
  // It returns a function that creates DOMPurify with JSDOM if window is not available
  const createDOMPurify = require('isomorphic-dompurify');
  
  // isomorphic-dompurify returns a function in Node.js that needs to be called with window
  // First call returns a function, second call with window returns DOMPurify instance
  const DOMPurifyFactory = createDOMPurify();
  
  // If it's a function, we need to call it with a window object
  if (typeof DOMPurifyFactory === 'function') {
    const { JSDOM } = require('jsdom');
    const window = new JSDOM('<!DOCTYPE html>').window;
    DOMPurify = DOMPurifyFactory(window);
  } else {
    // If it's already the DOMPurify object (browser environment)
    DOMPurify = DOMPurifyFactory;
  }
  
  // Verify DOMPurify has sanitize method
  if (!DOMPurify || typeof DOMPurify.sanitize !== 'function') {
    throw new Error('DOMPurify.sanitize is not a function. Got type: ' + typeof DOMPurify);
  }
} catch (error) {
  logger.warn('DOMPurify initialization failed, using basic sanitization:', error.message);
  DOMPurify = null;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - HTML string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(dirty, options = {}) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // If DOMPurify is not available, use basic sanitization
  if (!DOMPurify) {
    return basicSanitize(dirty);
  }

  const defaultOptions = {
    ALLOWED_TAGS: options.ALLOWED_TAGS || [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    ALLOWED_ATTR: options.ALLOWED_ATTR || [
      'href', 'title', 'alt', 'src', 'class'
    ],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  };

  const sanitizeOptions = { ...defaultOptions, ...options };

  try {
    return DOMPurify.sanitize(dirty, sanitizeOptions);
  } catch (error) {
    logger.error('HTML sanitization error:', error);
    return basicSanitize(dirty);
  }
}

/**
 * Basic sanitization fallback when DOMPurify is not available
 * @param {string} dirty - String to sanitize
 * @returns {string} - Sanitized string
 */
function basicSanitize(dirty) {
  if (typeof dirty !== 'string') {
    return '';
  }

  // Remove script tags and event handlers
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}

/**
 * Sanitize plain text (remove HTML tags and special characters)
 * @param {string} text - Text to sanitize
 * @param {object} options - Options
 * @returns {string} - Sanitized text
 */
function sanitizeText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const {
    maxLength = null,
    allowNewlines = false,
    trim = true
  } = options;

  let sanitized = text;

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/\n/g, ' ').replace(/\r/g, '');
  }

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize SQL input (additional layer on top of Sequelize parameterized queries)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeSQL(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove SQL injection patterns
  // Note: Sequelize already uses parameterized queries, this is an extra layer
  return input
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, ''); // Remove block comment end
}

/**
 * Sanitize file name to prevent path traversal and special characters
 * @param {string} filename - File name to sanitize
 * @returns {string} - Sanitized file name
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\//g, '-') // Replace slashes
    .replace(/\\/g, '-') // Replace backslashes
    .replace(/[^a-zA-Z0-9._-]/g, '-') // Keep only alphanumeric, dots, underscores, hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'file';
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent XSS and malicious redirects
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL or empty string if invalid
 */
function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Remove javascript: and data: protocols
    if (/^(javascript|data|vbscript):/i.test(url)) {
      return '';
    }

    // If it's a relative URL, ensure it starts with /
    if (url.startsWith('/')) {
      return url.replace(/[^a-zA-Z0-9\/._-]/g, '');
    }

    // For absolute URLs, validate the protocol
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }

    return urlObj.toString();
  } catch (error) {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitize object recursively
 * @param {any} obj - Object to sanitize
 * @param {object} options - Sanitization options
 * @returns {any} - Sanitized object
 */
function sanitizeObject(obj, options = {}) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    if (options.sanitizeHTML) {
      return sanitizeHTML(obj, options.htmlOptions);
    }
    return sanitizeText(obj, options.textOptions);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key
      const sanitizedKey = sanitizeText(key, { maxLength: 100 });
      // Sanitize the value
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
}

module.exports = {
  sanitizeHTML,
  sanitizeText,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  sanitizeObject,
  basicSanitize
};

