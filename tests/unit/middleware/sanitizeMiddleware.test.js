const {
  sanitizeBlogPost,
  sanitizeContactForm,
  sanitizeQuery,
  sanitizeParams
} = require('../../../src/backend/middleware/sanitizeMiddleware');

describe('Sanitize Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {};
    next = jest.fn();
  });

  describe('sanitizeBlogPost', () => {
    test('should sanitize title', () => {
      req.body.title = '<script>alert("XSS")</script>Title';
      sanitizeBlogPost(req, res, next);
      expect(req.body.title).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize HTML content', () => {
      req.body.content = '<script>alert("XSS")</script><p>Safe content</p>';
      sanitizeBlogPost(req, res, next);
      expect(req.body.content).not.toContain('<script>');
      expect(req.body.content).toContain('<p>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize excerpt', () => {
      req.body.excerpt = '<p>Excerpt</p>';
      sanitizeBlogPost(req, res, next);
      expect(req.body.excerpt).not.toContain('<p>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize and format slug', () => {
      req.body.slug = 'My Blog Post!!!';
      sanitizeBlogPost(req, res, next);
      expect(req.body.slug).not.toContain('!');
      expect(req.body.slug).toContain('-');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize tags array', () => {
      req.body.tags = ['<script>tag</script>', 'safe-tag', 'another tag'];
      sanitizeBlogPost(req, res, next);
      expect(req.body.tags).not.toContain('<script>');
      expect(req.body.tags.length).toBeLessThanOrEqual(20);
      expect(next).toHaveBeenCalled();
    });

    test('should limit title length', () => {
      req.body.title = 'a'.repeat(300);
      sanitizeBlogPost(req, res, next);
      expect(req.body.title.length).toBeLessThanOrEqual(200);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizeContactForm', () => {
    test('should sanitize name', () => {
      req.body.name = '<script>alert("XSS")</script>John';
      sanitizeContactForm(req, res, next);
      expect(req.body.name).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize email', () => {
      req.body.email = 'TEST@EXAMPLE.COM';
      sanitizeContactForm(req, res, next);
      expect(req.body.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize subject', () => {
      req.body.subject = '<p>Subject</p>';
      sanitizeContactForm(req, res, next);
      expect(req.body.subject).not.toContain('<p>');
      expect(next).toHaveBeenCalled();
    });

    test('should sanitize message HTML', () => {
      req.body.message = '<script>alert("XSS")</script><p>Message</p>';
      sanitizeContactForm(req, res, next);
      expect(req.body.message).not.toContain('<script>');
      expect(req.body.message).toContain('<p>'); // Allowed tag
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizeQuery', () => {
    test('should sanitize query parameters', () => {
      req.query.search = '<script>alert("XSS")</script>';
      sanitizeQuery(req, res, next);
      expect(req.query.search).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should limit query parameter length', () => {
      req.query.search = 'a'.repeat(600);
      sanitizeQuery(req, res, next);
      expect(req.query.search.length).toBeLessThanOrEqual(500);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sanitizeParams', () => {
    test('should sanitize URL parameters', () => {
      req.params.id = '<script>alert("XSS")</script>';
      sanitizeParams(req, res, next);
      expect(req.params.id).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    test('should limit param length', () => {
      req.params.id = 'a'.repeat(300);
      sanitizeParams(req, res, next);
      expect(req.params.id.length).toBeLessThanOrEqual(200);
      expect(next).toHaveBeenCalled();
    });
  });
});

