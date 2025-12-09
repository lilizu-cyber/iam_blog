# Input Sanitization & Security

This document describes the input sanitization and security measures implemented in the IAM Blog application.

## Overview

All user inputs are sanitized and validated to prevent:
- **XSS (Cross-Site Scripting)** attacks
- **SQL Injection** attacks
- **Path Traversal** attacks
- **File Upload** vulnerabilities
- **Malicious Redirects**

## Implementation

### 1. HTML Sanitization

**Library**: `isomorphic-dompurify` (DOMPurify for Node.js)

**Usage**: All HTML content is sanitized before storage.

**Allowed HTML Tags** (for blog posts):
- Text formatting: `p`, `br`, `strong`, `em`, `u`
- Headings: `h1` through `h6`
- Lists: `ul`, `ol`, `li`
- Code: `code`, `pre`
- Links: `a` (with `href`, `title`, `target` attributes)
- Images: `img` (with `src`, `alt` attributes)
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Quotes: `blockquote`

**Allowed Attributes**:
- `href`, `title`, `alt`, `src`, `class`, `target`

**Example**:
```javascript
// Input
const userInput = '<script>alert("XSS")</script><p>Safe content</p>';

// Output (sanitized)
const sanitized = '<p>Safe content</p>'; // Script tag removed
```

### 2. Text Sanitization

Plain text fields are sanitized to:
- Remove HTML tags
- Decode HTML entities
- Remove newlines (if not allowed)
- Trim whitespace
- Limit length

**Fields Sanitized**:
- Blog post titles
- Excerpts
- SEO titles/descriptions
- Contact form names/subjects
- Tags
- Slugs

### 3. File Upload Validation

**Strict Validation**:
- **MIME Type Checking**: Only allowed MIME types accepted
- **Extension Validation**: File extension must match MIME type
- **Filename Sanitization**: Path traversal and special characters removed
- **Size Limits**: 10MB maximum file size

**Allowed File Types**:

**Images**:
- MIME Types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- Extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`

**Documents**:
- MIME Types: `application/pdf`
- Extensions: `.pdf`

**Security Checks**:
- Rejects files with `..` in filename (path traversal)
- Rejects files with null bytes (`\0`)
- Rejects files with slashes in filename
- Validates MIME type matches extension
- Sanitizes filename before storage

**Example**:
```javascript
// Dangerous filename
const dangerous = '../../../etc/passwd';

// Sanitized filename
const safe = 'etc-passwd-1234567890'; // Path traversal removed
```

### 4. SQL Injection Prevention

**Primary Protection**: Sequelize uses parameterized queries by default, preventing SQL injection.

**Additional Measures**:
- SQL injection pattern detection and logging
- Suspicious input monitoring
- Request logging for security analysis

**How Sequelize Prevents SQL Injection**:
```javascript
// Sequelize automatically uses parameterized queries
User.findOne({
  where: { username: userInput } // Safe - parameterized
});

// This is converted to:
// SELECT * FROM users WHERE username = $1
// With userInput as parameter, not concatenated
```

**Monitoring**:
- Logs suspicious SQL patterns in user input
- Tracks IP addresses of potential attacks
- Records field names and input previews

### 5. URL Sanitization

URLs are sanitized to prevent:
- JavaScript protocol (`javascript:`)
- Data URIs (`data:`)
- VBScript protocol (`vbscript:`)
- Unauthorized redirects

**Allowed Protocols**:
- `http:`
- `https:`
- `mailto:`

**Example**:
```javascript
// Dangerous URL
const dangerous = 'javascript:alert("XSS")';

// Sanitized (returns empty string)
const safe = ''; // Blocked
```

### 6. Middleware Integration

**Global Sanitization**:
- Query parameters sanitized automatically
- URL parameters sanitized automatically
- SQL injection patterns logged

**Route-Specific Sanitization**:
- Blog posts: HTML content sanitized, text fields cleaned
- Contact forms: HTML sanitized, text fields cleaned
- File uploads: Validated and sanitized

## Usage Examples

### Sanitizing Blog Post Content

```javascript
const { sanitizeBlogPost } = require('./middleware/sanitizeMiddleware');

router.post('/posts',
  sanitizeBlogPost, // Automatically sanitizes title, content, excerpt, etc.
  // ... other middleware
);
```

### Sanitizing Contact Forms

```javascript
const { sanitizeContactForm } = require('./middleware/sanitizeMiddleware');

router.post('/send',
  sanitizeContactForm, // Sanitizes name, email, subject, message
  // ... other middleware
);
```

### Manual Sanitization

```javascript
const { sanitizeHTML, sanitizeText, sanitizeURL } = require('./utils/sanitizer');

// Sanitize HTML
const cleanHTML = sanitizeHTML(userInput, {
  ALLOWED_TAGS: ['p', 'strong', 'em'],
  ALLOWED_ATTR: ['href']
});

// Sanitize text
const cleanText = sanitizeText(userInput, {
  maxLength: 100,
  allowNewlines: false
});

// Sanitize URL
const cleanURL = sanitizeURL(userInput);
```

## Security Best Practices

1. **Always Sanitize User Input**: Never trust user input, even from authenticated users
2. **Use Parameterized Queries**: Sequelize handles this automatically
3. **Validate File Uploads**: Check MIME type, extension, and filename
4. **Limit Input Length**: Prevent buffer overflow attacks
5. **Log Suspicious Activity**: Monitor for attack patterns
6. **Keep Dependencies Updated**: Regularly update sanitization libraries

## Testing

### Test XSS Prevention

```javascript
// Try injecting script
const xssInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeHTML(xssInput);
// Result: Script tag removed
```

### Test SQL Injection Prevention

```javascript
// Sequelize automatically prevents this
User.findOne({
  where: { username: "admin' OR '1'='1" }
});
// Result: Treated as literal string, not SQL code
```

### Test File Upload Security

```javascript
// Try uploading dangerous file
const dangerousFile = {
  originalname: '../../../etc/passwd',
  mimetype: 'text/plain'
};
// Result: Rejected - path traversal detected
```

## Monitoring

All suspicious activity is logged:
- SQL injection attempts
- Path traversal attempts
- Invalid file uploads
- XSS patterns in input

Check logs for:
```
Potential SQL injection attempt detected
File upload rejected - suspicious filename
HTML sanitization error
```

## Configuration

### Environment Variables

- `IMAGE_OPTIMIZATION_ENABLED`: Enable/disable image optimization (default: true)

### Customization

You can customize sanitization in `src/backend/utils/sanitizer.js`:
- Adjust allowed HTML tags
- Modify text sanitization rules
- Change file upload limits
- Update SQL injection patterns

## Dependencies

- `isomorphic-dompurify`: HTML sanitization
- `express-validator`: Input validation
- `multer`: File upload handling
- `sequelize`: ORM with built-in SQL injection prevention

## References

- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Sequelize Security](https://sequelize.org/docs/v6/other-topics/security/)



