const request = require('supertest');
const express = require('express');
const { sanitizeBlogPost, sanitizeContactForm } = require('../../src/backend/middleware/sanitizeMiddleware');

describe('Sanitization Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Blog Post Sanitization', () => {
    test('should sanitize XSS in blog post title', async () => {
      app.post('/test', sanitizeBlogPost, (req, res) => {
        res.json({ title: req.body.title });
      });

      const response = await request(app)
        .post('/test')
        .send({ title: '<script>alert("XSS")</script>My Title' });

      expect(response.body.title).not.toContain('<script>');
      expect(response.body.title).toContain('My Title');
    });

    test('should sanitize HTML in blog post content', async () => {
      app.post('/test', sanitizeBlogPost, (req, res) => {
        res.json({ content: req.body.content });
      });

      const response = await request(app)
        .post('/test')
        .send({ content: '<script>alert("XSS")</script><p>Safe content</p>' });

      expect(response.body.content).not.toContain('<script>');
      expect(response.body.content).toContain('<p>');
    });

    test('should sanitize and format slug', async () => {
      app.post('/test', sanitizeBlogPost, (req, res) => {
        res.json({ slug: req.body.slug });
      });

      const response = await request(app)
        .post('/test')
        .send({ slug: 'My Blog Post!!!' });

      expect(response.body.slug).not.toContain('!');
      expect(response.body.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Contact Form Sanitization', () => {
    test('should sanitize contact form inputs', async () => {
      app.post('/test', sanitizeContactForm, (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test')
        .send({
          name: '<script>alert("XSS")</script>John',
          email: 'TEST@EXAMPLE.COM',
          subject: '<p>Subject</p>',
          message: '<script>alert("XSS")</script><p>Message</p>'
        });

      expect(response.body.name).not.toContain('<script>');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.subject).not.toContain('<p>');
      expect(response.body.message).not.toContain('<script>');
    });
  });
});

