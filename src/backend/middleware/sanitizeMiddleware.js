const { sanitizeHTML, sanitizeText, sanitizeObject } = require('../utils/sanitizer');
const logger = require('../utils/logger');

/**
 * Middleware to sanitize request body
 * @param {object} options - Sanitization options
 * @returns {Function} - Express middleware
 */
function sanitizeBody(options = {}) {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, {
          sanitizeHTML: options.sanitizeHTML !== false,
          htmlOptions: options.htmlOptions,
          textOptions: options.textOptions
        });
      }
      next();
    } catch (error) {
      logger.error('Body sanitization error:', error);
      next();
    }
  };
}

/**
 * Middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
  try {
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeText(value, { maxLength: 500 });
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Query sanitization error:', error);
    next();
  }
}

/**
 * Middleware to sanitize URL parameters
 */
function sanitizeParams(req, res, next) {
  try {
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeText(value, { maxLength: 200 });
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Params sanitization error:', error);
    next();
  }
}

/**
 * Sanitize blog post content (allows HTML but sanitizes it)
 */
function sanitizeBlogPost(req, res, next) {
  try {
    if (req.body) {
      // Sanitize title (plain text)
      if (req.body.title) {
        req.body.title = sanitizeText(req.body.title, { maxLength: 200 });
      }

      // Sanitize content (allows HTML)
      if (req.body.content) {
        req.body.content = sanitizeHTML(req.body.content, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
            'thead', 'tbody', 'tr', 'th', 'td'
          ],
          ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'target']
        });
      }

      // Sanitize excerpt (plain text)
      if (req.body.excerpt) {
        req.body.excerpt = sanitizeText(req.body.excerpt, { maxLength: 500, allowNewlines: true });
      }

      // Sanitize SEO fields (plain text)
      if (req.body.seoTitle) {
        req.body.seoTitle = sanitizeText(req.body.seoTitle, { maxLength: 200 });
      }

      if (req.body.seoDescription) {
        req.body.seoDescription = sanitizeText(req.body.seoDescription, { maxLength: 300 });
      }

      // Sanitize slug
      if (req.body.slug) {
        req.body.slug = sanitizeText(req.body.slug, { maxLength: 200 })
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Sanitize tags array
      if (Array.isArray(req.body.tags)) {
        req.body.tags = req.body.tags
          .filter(tag => typeof tag === 'string')
          .map(tag => sanitizeText(tag, { maxLength: 50 })
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''))
          .filter(tag => tag.length > 0)
          .slice(0, 20); // Limit to 20 tags
      }
    }
    next();
  } catch (error) {
    logger.error('Blog post sanitization error:', error);
    next();
  }
}

/**
 * Sanitize contact form input
 */
function sanitizeContactForm(req, res, next) {
  try {
    if (req.body) {
      if (req.body.name) {
        req.body.name = sanitizeText(req.body.name, { maxLength: 100 });
      }

      if (req.body.email) {
        // Email is already validated by express-validator, just sanitize
        req.body.email = sanitizeText(req.body.email, { maxLength: 255 }).toLowerCase();
      }

      if (req.body.subject) {
        req.body.subject = sanitizeText(req.body.subject, { maxLength: 200 });
      }

      if (req.body.message) {
        // Allow some HTML in messages but sanitize it
        req.body.message = sanitizeHTML(req.body.message, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
          ALLOWED_ATTR: ['href']
        });
      }
    }
    next();
  } catch (error) {
    logger.error('Contact form sanitization error:', error);
    next();
  }
}

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeBlogPost,
  sanitizeContactForm
};

