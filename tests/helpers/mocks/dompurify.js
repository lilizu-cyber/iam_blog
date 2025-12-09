/**
 * Mock for isomorphic-dompurify in Jest tests
 * Since isomorphic-dompurify uses ES modules and Jest has issues with it,
 * we provide a simple mock that implements basic sanitization
 */

function createDOMPurify() {
  return {
    sanitize: (dirty, options = {}) => {
      if (!dirty || typeof dirty !== 'string') {
        return '';
      }

      let sanitized = dirty;

      // Remove script tags
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Remove event handlers
      sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

      // Remove javascript: protocol
      sanitized = sanitized.replace(/javascript:/gi, '');

      // Remove data: protocol
      sanitized = sanitized.replace(/data:text\/html/gi, '');

      // If ALLOWED_TAGS is specified, only keep those tags
      if (options.ALLOWED_TAGS && Array.isArray(options.ALLOWED_TAGS)) {
        const allowedTags = options.ALLOWED_TAGS.join('|');
        const tagRegex = new RegExp(`<(?!/?(?:${allowedTags})(?:\s|>))[^>]+>`, 'gi');
        sanitized = sanitized.replace(tagRegex, '');
      }

      // If ALLOWED_ATTR is specified, remove disallowed attributes
      if (options.ALLOWED_ATTR && Array.isArray(options.ALLOWED_ATTR)) {
        const allowedAttrs = options.ALLOWED_ATTR.join('|');
        const attrRegex = new RegExp(`\s(?!${allowedAttrs})[a-z-]+=["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(attrRegex, '');
      }

      return sanitized;
    }
  };
}

module.exports = createDOMPurify;



