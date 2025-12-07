const {
  sanitizeHTML,
  sanitizeText,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  sanitizeObject
} = require('../../../src/backend/utils/sanitizer');

describe('Sanitizer Utilities', () => {
  describe('sanitizeHTML', () => {
    test('should remove script tags', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    test('should remove event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    test('should allow safe HTML tags', () => {
      const input = '<p>Paragraph</p><strong>Bold</strong><em>Italic</em>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    test('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    test('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    test('should remove HTML tags', () => {
      const input = '<p>Text</p><script>alert("XSS")</script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('Text');
    });

    test('should decode HTML entities', () => {
      const input = '&lt;script&gt;&amp;test&lt;/script&gt;';
      const result = sanitizeText(input);
      expect(result).not.toContain('&lt;');
      expect(result).not.toContain('&amp;');
    });

    test('should limit length', () => {
      const input = 'a'.repeat(200);
      const result = sanitizeText(input, { maxLength: 100 });
      expect(result.length).toBe(100);
    });

    test('should remove newlines when not allowed', () => {
      const input = 'Line 1\nLine 2\rLine 3';
      const result = sanitizeText(input, { allowNewlines: false });
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\r');
    });

    test('should trim whitespace', () => {
      const input = '  text  ';
      const result = sanitizeText(input, { trim: true });
      expect(result).toBe('text');
    });
  });

  describe('sanitizeSQL', () => {
    test('should remove SQL comments', () => {
      const input = "test--comment";
      const result = sanitizeSQL(input);
      expect(result).not.toContain('--');
    });

    test('should remove semicolons', () => {
      const input = "test;DROP TABLE users;";
      const result = sanitizeSQL(input);
      expect(result).not.toContain(';');
    });

    test('should remove quotes', () => {
      const input = "test' OR '1'='1";
      const result = sanitizeSQL(input);
      expect(result).not.toContain("'");
    });
  });

  describe('sanitizeFilename', () => {
    test('should prevent path traversal', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    test('should remove special characters', () => {
      const input = 'file<script>.txt';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('should keep valid characters', () => {
      const input = 'my-file_123.pdf';
      const result = sanitizeFilename(input);
      expect(result).toContain('my-file_123.pdf');
    });

    test('should limit length', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(input);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    test('should handle empty input', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('file');
    });
  });

  describe('sanitizeURL', () => {
    test('should block javascript: protocol', () => {
      const input = 'javascript:alert("XSS")';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    test('should block data: protocol', () => {
      const input = 'data:text/html,<script>alert("XSS")</script>';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    test('should allow http URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeURL(input);
      expect(result).toContain('http://');
    });

    test('should allow https URLs', () => {
      const input = 'https://example.com';
      const result = sanitizeURL(input);
      expect(result).toContain('https://');
    });

    test('should sanitize relative URLs', () => {
      const input = '/path/to/file';
      const result = sanitizeURL(input);
      expect(result).toContain('/path/to/file');
    });

    test('should handle invalid URLs', () => {
      const input = 'not-a-url';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize nested objects', () => {
      const input = {
        title: '<script>alert("XSS")</script>',
        content: '<p>Safe</p>',
        nested: {
          value: '<img src=x onerror=alert(1)>'
        }
      };
      const result = sanitizeObject(input, { sanitizeHTML: true });
      expect(result.title).not.toContain('<script>');
      expect(result.nested.value).not.toContain('onerror');
    });

    test('should sanitize arrays', () => {
      const input = ['<script>alert(1)</script>', 'safe text'];
      const result = sanitizeObject(input, { sanitizeHTML: false });
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe text');
    });

    test('should sanitize object keys', () => {
      const input = {
        '<script>key</script>': 'value'
      };
      const result = sanitizeObject(input);
      const keys = Object.keys(result);
      expect(keys[0]).not.toContain('<script>');
    });
  });
});

