# Sanitization Testing Guide

This guide explains how to test the input sanitization system.

## Running Tests

### Automated Tests (Jest)

Run all sanitization unit tests:
```bash
npm run test:sanitization
```

Run specific test files:
```bash
# Test sanitizer utilities
npm test tests/unit/utils/sanitizer.test.js

# Test middleware
npm test tests/unit/middleware/sanitizeMiddleware.test.js

# Test SQL injection detection
npm test tests/unit/utils/sqlInjectionCheck.test.js

# Test integration
npm test tests/integration/sanitization.test.js
```

### Manual Testing Script

Run the interactive manual testing script:
```bash
npm run test:sanitization:manual
```

This script will:
- Test XSS prevention
- Test SQL injection detection
- Test path traversal prevention
- Test URL sanitization
- Test text sanitization
- Test object sanitization

## Test Coverage

### 1. XSS Prevention Tests

Tests that HTML sanitization removes:
- `<script>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` protocol
- `data:` protocol
- While preserving safe HTML tags

**Example Test**:
```javascript
const input = '<script>alert("XSS")</script><p>Safe</p>';
const result = sanitizeHTML(input);
// Result: '<p>Safe</p>' (script tag removed)
```

### 2. SQL Injection Detection Tests

Tests that SQL injection patterns are detected:
- `UNION SELECT` statements
- Boolean-based injection (`OR 1=1`)
- `DROP TABLE` statements
- SQL comments (`--`, `/* */`)
- While allowing safe input

**Example Test**:
```javascript
const input = "admin' OR '1'='1";
const result = containsSQLInjection(input);
// Result: true (suspicious pattern detected)
```

### 3. Path Traversal Prevention Tests

Tests that filenames are sanitized:
- Removes `../` (path traversal)
- Removes special characters
- Preserves valid filenames
- Limits length

**Example Test**:
```javascript
const input = '../../../etc/passwd';
const result = sanitizeFilename(input);
// Result: 'etc-passwd' (path traversal removed)
```

### 4. URL Sanitization Tests

Tests that URLs are validated:
- Blocks `javascript:` protocol
- Blocks `data:` protocol
- Allows `http:` and `https:`
- Validates URL format

**Example Test**:
```javascript
const input = 'javascript:alert("XSS")';
const result = sanitizeURL(input);
// Result: '' (blocked)
```

### 5. Text Sanitization Tests

Tests that plain text is cleaned:
- Removes HTML tags
- Decodes HTML entities
- Limits length
- Trims whitespace

**Example Test**:
```javascript
const input = '<p>Text</p>';
const result = sanitizeText(input);
// Result: 'Text' (HTML tags removed)
```

## Manual Testing in Browser

### Test XSS Prevention

1. **Create a blog post** with malicious content:
   ```html
   <script>alert("XSS")</script>
   <img src=x onerror=alert(1)>
   <a href="javascript:alert('XSS')">Click</a>
   ```

2. **Verify** that:
   - Script tags are removed
   - Event handlers are removed
   - JavaScript protocol is blocked
   - Safe HTML is preserved

### Test SQL Injection Prevention

1. **Try SQL injection** in login form:
   ```
   Username: admin' OR '1'='1
   Password: anything
   ```

2. **Verify** that:
   - Login fails (not vulnerable)
   - Pattern is logged in server logs
   - Sequelize uses parameterized queries

### Test File Upload Security

1. **Try uploading** dangerous files:
   - File with `../` in name: `../../../etc/passwd`
   - File with wrong extension: `malware.exe` (renamed to `.jpg`)
   - File with null bytes: `file\0.jpg`

2. **Verify** that:
   - Path traversal is blocked
   - MIME type must match extension
   - Invalid filenames are rejected

## Integration Testing

### Test with Express App

```javascript
const request = require('supertest');
const app = require('../src/backend/server');

// Test blog post sanitization
test('POST /api/blog/posts sanitizes input', async () => {
  const response = await request(app)
    .post('/api/blog/posts')
    .set('Cookie', 'adminToken=valid-token')
    .send({
      title: '<script>alert("XSS")</script>',
      content: '<p>Safe</p>'
    });
  
  // Verify sanitization happened
  expect(response.body.data.title).not.toContain('<script>');
});
```

## Expected Results

### ✅ Safe Input Should Pass

- Normal text: `"Hello World"`
- Valid HTML: `"<p>Paragraph</p>"`
- Valid URLs: `"https://example.com"`
- Valid filenames: `"image.jpg"`
- Valid emails: `"user@example.com"`

### ❌ Dangerous Input Should Be Sanitized

- XSS attempts: `<script>alert("XSS")</script>`
- SQL injection: `admin' OR '1'='1`
- Path traversal: `../../../etc/passwd`
- Malicious URLs: `javascript:alert("XSS")`
- Dangerous filenames: `file<script>.txt`

## Debugging Failed Tests

1. **Check the actual output**:
   ```javascript
   console.log('Input:', input);
   console.log('Output:', result);
   ```

2. **Verify DOMPurify is loaded**:
   ```javascript
   const DOMPurify = require('isomorphic-dompurify');
   console.log('DOMPurify loaded:', !!DOMPurify);
   ```

3. **Check middleware order**:
   - Sanitization should happen BEFORE validation
   - Sanitization should happen AFTER body parsing

## Performance Testing

Test sanitization performance:
```bash
# Run with coverage
npm run test:coverage -- tests/unit/utils/sanitizer.test.js

# Check execution time
time npm run test:sanitization
```

## Continuous Integration

Sanitization tests run automatically in CI:
- All unit tests must pass
- Coverage threshold: 70%
- Integration tests verify end-to-end flow

## Reporting Issues

If a test fails:
1. Note the input that caused the failure
2. Check the sanitized output
3. Verify if it's a false positive or actual vulnerability
4. Report with:
   - Input value
   - Expected output
   - Actual output
   - Test file and line number

