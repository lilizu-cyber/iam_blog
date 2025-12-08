const request = require('supertest');
const express = require('express');
const blogRoutes = require('../../../src/backend/api/routes/blogRoutes');
const { mockCommandBus, mockQueryBus, mockReadModelStore, mockUser } = require('../../helpers/mocks');

// Mock authentication middleware
jest.mock('../../../src/backend/middleware/authMiddleware', () => ({
  authenticateAdmin: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

// Mock rate limiter
jest.mock('../../../src/backend/middleware/rateLimiter', () => ({
  writeLimiter: (req, res, next) => next(),
  readLimiter: (req, res, next) => next()
}));

describe('Blog Routes', () => {
  let app;
  let commandBus;
  let queryBus;
  let readModelStore;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    commandBus = { ...mockCommandBus };
    queryBus = { ...mockQueryBus };
    readModelStore = { ...mockReadModelStore };
    
    app.use('/api/blog', blogRoutes(commandBus, queryBus, readModelStore));
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/blog/posts', () => {
    it('should return published posts', async () => {
      const mockResult = {
        posts: [
          {
            id: 'post-1',
            title: 'Test Post 1',
            status: 'published'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/blog/posts')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GetPublishedBlogPosts'
        })
      );
    });

    it('should handle query parameters correctly', async () => {
      queryBus.execute.mockResolvedValue({ posts: [], pagination: {} });

      await request(app)
        .get('/api/blog/posts')
        .query({ page: 2, limit: 20, sortBy: 'title', sortOrder: 'asc' });

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            page: 2,
            limit: 20,
            sortBy: 'title',
            sortOrder: 'asc'
          })
        })
      );
    });
  });

  describe('GET /api/blog/posts/:postId', () => {
    it('should return a single post by ID', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        content: 'Test content'
      };

      queryBus.execute.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/api/blog/posts/post-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'post-123');
    });

    it('should return 404 if post not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/blog/posts/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/blog/posts', () => {
    it('should create a new blog post', async () => {
      const postData = {
        title: 'New Post',
        content: 'Post content',
        excerpt: 'Post excerpt'
      };

      commandBus.execute.mockResolvedValue({
        postId: 'post-123',
        success: true
      });

      const response = await request(app)
        .post('/api/blog/posts')
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CreateBlogPost',
          data: expect.objectContaining({
            title: 'New Post',
            authorId: mockUser.id
          })
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/blog/posts')
        .send({
          title: '', // Empty title
          content: 'Content'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('PUT /api/blog/posts/:postId', () => {
    it('should update a blog post', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      commandBus.execute.mockResolvedValue({
        postId: 'post-123',
        success: true
      });

      const response = await request(app)
        .put('/api/blog/posts/post-123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateBlogPost',
          data: expect.objectContaining({
            postId: 'post-123',
            title: 'Updated Title'
          })
        })
      );
    });
  });

  describe('GET /api/blog/iam', () => {
    it('should return IAM-related posts', async () => {
      const mockResult = {
        posts: [
          {
            id: 'post-1',
            title: 'IAM Post',
            flags: { isIAMRelated: true }
          }
        ],
        pagination: {}
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/blog/iam')
        .query({ limit: 12 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GetIAMRelatedPosts'
        })
      );
    });
  });

  describe('GET /api/blog/security', () => {
    it('should return security-related posts', async () => {
      const mockResult = {
        posts: [],
        pagination: {}
      };

      queryBus.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/blog/security')
        .query({ limit: 12 });

      expect(response.status).toBe(200);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GetSecurityRelatedPosts'
        })
      );
    });
  });
});


