const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../../utils/logger');
const { writeLimiter, readLimiter } = require('../../middleware/rateLimiter');
const { sanitizeBlogPost } = require('../../middleware/sanitizeMiddleware');

// Middleware for handling validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Import authentication middleware
const { authenticateAdmin } = require('../../middleware/authMiddleware');

// Use the real authentication middleware
const authenticate = authenticateAdmin;

// Middleware for authorization
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = (commandBus, queryBus, readModelStore) => {
  // Command endpoints (Write operations)
  
  // Create blog post
  router.post('/posts',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    sanitizeBlogPost, // Sanitize input
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('content').notEmpty().withMessage('Content is required'),
      body('excerpt').optional().isString(),
      body('categoryId').optional().custom((value) => {
        // Allow empty string, null, or valid category strings
        if (!value || value === '' || value === null) return true;
        const validCategories = ['security', 'iam', 'ai', 'compliance'];
        if (typeof value === 'string' && validCategories.includes(value.toLowerCase())) return true;
        // Also allow UUID format if needed
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return true;
        throw new Error('Invalid categoryId');
      }),
      body('tags').optional().isArray(),
      body('slug').optional().isString(),
      body('featuredImage').optional().custom((value) => {
        // Allow null, empty object, or valid object
        if (value === null || value === undefined) return true;
        if (typeof value === 'object' && !Array.isArray(value)) return true;
        throw new Error('featuredImage must be an object or null');
      }),
      body('attachments').optional().isArray(),
      body('seoTitle').optional().isString(),
      body('seoDescription').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'CreateBlogPost',
          data: {
            ...req.body,
            authorId: req.user.id,
            authorName: req.user.name || req.user.username || 'Admin',
            authorEmail: req.user.email || 'admin@example.com'
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.status(201).json({
          success: true,
          message: 'Blog post created successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Update blog post
  router.put('/posts/:postId',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    sanitizeBlogPost, // Sanitize input
    [
      param('postId').isUUID().withMessage('Invalid post ID'),
      body('title').optional().notEmpty(),
      body('content').optional().notEmpty(),
      body('excerpt').optional().isString(),
      body('categoryId').optional().custom((value) => {
        // Allow empty string, null, or valid category strings
        if (!value || value === '' || value === null) return true;
        const validCategories = ['security', 'iam', 'ai', 'compliance'];
        if (typeof value === 'string' && validCategories.includes(value.toLowerCase())) return true;
        // Also allow UUID format if needed
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return true;
        throw new Error('Invalid categoryId');
      }),
      body('featuredImage').optional().custom((value) => {
        // Allow null, empty object, or valid object
        if (value === null || value === undefined) return true;
        if (typeof value === 'object' && !Array.isArray(value)) return true;
        throw new Error('featuredImage must be an object or null');
      }),
      body('attachments').optional().isArray(),
      body('seoTitle').optional().isString(),
      body('seoDescription').optional().isString()
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'UpdateBlogPost',
          data: {
            postId: req.params.postId,
            ...req.body
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Blog post updated successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Publish blog post
  router.post('/posts/:postId/publish',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    [
      param('postId').isUUID().withMessage('Invalid post ID')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'PublishBlogPost',
          data: {
            postId: req.params.postId,
            authorId: req.user.id
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Blog post published successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Unpublish blog post
  router.post('/posts/:postId/unpublish',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    [
      param('postId').isUUID().withMessage('Invalid post ID')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'UnpublishBlogPost',
          data: {
            postId: req.params.postId,
            authorId: req.user.id
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Blog post unpublished successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Delete blog post
  router.delete('/posts/:postId',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    [
      param('postId').notEmpty().withMessage('Post ID is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'DeleteBlogPost',
          data: {
            postId: req.params.postId,
            authorId: req.user.id
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Blog post deleted successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Add tag to blog post
  router.post('/posts/:postId/tags',
    authenticate,
    [
      param('postId').isUUID().withMessage('Invalid post ID'),
      body('tag').notEmpty().withMessage('Tag is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'AddTagToBlogPost',
          data: {
            postId: req.params.postId,
            tag: req.body.tag
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Tag added successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Remove tag from blog post
  router.delete('/posts/:postId/tags/:tag',
    authenticate,
    [
      param('postId').isUUID().withMessage('Invalid post ID'),
      param('tag').notEmpty().withMessage('Tag is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const command = {
          type: 'RemoveTagFromBlogPost',
          data: {
            postId: req.params.postId,
            tag: req.params.tag
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Tag removed successfully',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Query endpoints (Read operations)

  // Admin: Get all blog posts (including drafts)
  router.get('/admin/posts',
    authenticate,
    [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('status').optional().isIn(['draft', 'published', 'archived', 'deleted']),
      query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'publishedAt', 'title']),
      query('sortOrder').optional().isIn(['asc', 'desc'])
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        const skip = (page - 1) * limit;
        // sortBy is in camelCase (e.g., 'createdAt'), ReadModelStore.find will convert to snake_case
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Build query - include all statuses unless filtered
        const query = {};
        if (status) {
          query.status = status;
        } else {
          // Exclude deleted posts by default, include drafts, published, and archived
          query.status = { $in: ['draft', 'published', 'archived'] };
        }

        logger.debug('Admin posts query', { query, sort, limit, skip });

        const posts = await readModelStore.find('BlogPost', query, {
          sort,
          limit,
          skip
        });

        logger.debug('Admin posts found', { count: posts.length });

        const total = await readModelStore.count('BlogPost', query);

        // Format posts for response
        const formattedPosts = posts.map(post => ({
          id: post.postId,
          title: post.title,
          excerpt: post.excerpt,
          status: post.status,
          author: {
            id: post.authorId,
            name: post.authorName || 'Admin',
            email: post.authorEmail || 'admin@example.com'
          },
          category: post.categoryId ? {
            id: post.categoryId,
            name: post.categoryName
          } : null,
          tags: post.tags || [],
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          viewCount: post.viewCount || 0,
          slug: post.slug
        }));

        res.json({
          success: true,
          data: {
            posts: formattedPosts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1
            }
          }
        });
      } catch (error) {
        logger.error('Error fetching admin posts:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get blog post by ID
  router.get('/posts/:postId',
    readLimiter, // 200 read requests per 15 minutes
    [
      param('postId').isUUID().withMessage('Invalid post ID')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const query = {
          type: 'GetBlogPostById',
          parameters: {
            postId: req.params.postId
          }
        };

        const result = await queryBus.execute(query);
        
        if (!result) {
          return res.status(404).json({
            success: false,
            message: 'Blog post not found'
          });
        }

        // Track page view
        const viewCommand = {
          type: 'TrackPageView',
          data: {
            postId: req.params.postId,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };
        
        // Fire and forget - don't wait for completion
        commandBus.execute(viewCommand).catch(error => {
          console.error('Error tracking page view:', error);
        });

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get blog post by slug
  router.get('/posts/slug/:slug',
    readLimiter, // 200 read requests per 15 minutes
    [
      param('slug').notEmpty().withMessage('Slug is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const query = {
          type: 'GetBlogPostBySlug',
          parameters: {
            slug: req.params.slug
          }
        };

        const result = await queryBus.execute(query);
        
        if (!result) {
          return res.status(404).json({
            success: false,
            message: 'Blog post not found'
          });
        }

        // Track page view
        const viewCommand = {
          type: 'TrackPageView',
          data: {
            postId: result.id,
            userId: req.user?.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };
        
        commandBus.execute(viewCommand).catch(error => {
          console.error('Error tracking page view:', error);
        });

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get published blog posts
  router.get('/posts',
    readLimiter, // 200 read requests per 15 minutes
    [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('sortBy').optional().isIn(['publishedAt', 'title', 'viewCount', 'popularityScore']),
      query('sortOrder').optional().isIn(['asc', 'desc'])
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        if (!queryBus) {
          logger.error('QueryBus is not initialized in /posts endpoint');
          return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable'
          });
        }

        const query = {
          type: 'GetPublishedBlogPosts',
          parameters: {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'publishedAt',
            sortOrder: req.query.sortOrder || 'desc'
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Error in /posts endpoint:', {
          error: error.message,
          stack: error.stack,
          query: req.query
        });
        
        const statusCode = error.message.includes('handler') ||
                          error.message.includes('not available') ||
                          error.message.includes('connection') ? 503 : 500;
        
        res.status(statusCode).json({
          success: false,
          message: process.env.NODE_ENV === 'production'
            ? 'An error occurred while fetching posts'
            : error.message
        });
      }
    }
  );

  // Get blog posts by author
  router.get('/authors/:authorId/posts',
    [
      param('authorId').isUUID().withMessage('Invalid author ID'),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('includeUnpublished').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const query = {
          type: 'GetBlogPostsByAuthor',
          parameters: {
            authorId: req.params.authorId,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            includeUnpublished: req.query.includeUnpublished === 'true'
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Search blog posts
  router.get('/search',
    [
      query('q').notEmpty().withMessage('Search query is required'),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('categoryId').optional().isUUID(),
      query('authorId').optional().isUUID(),
      query('tags').optional().isString(),
      query('securityOnly').optional().isBoolean(),
      query('iamOnly').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const filters = {};
        if (req.query.categoryId) filters.categoryId = req.query.categoryId;
        if (req.query.authorId) filters.authorId = req.query.authorId;
        if (req.query.tags) filters.tags = req.query.tags.split(',');
        if (req.query.securityOnly === 'true') filters.isSecurityRelated = true;
        if (req.query.iamOnly === 'true') filters.isIAMRelated = true;

        const query = {
          type: 'SearchBlogPosts',
          parameters: {
            searchText: req.query.q,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            filters
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get popular blog posts
  router.get('/popular',
    [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('timeframe').optional().isInt({ min: 1, max: 365 })
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const query = {
          type: 'GetPopularBlogPosts',
          parameters: {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            timeframe: parseInt(req.query.timeframe) || 30
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get security-related blog posts
  router.get('/security',
    readLimiter, // 200 read requests per 15 minutes
    [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const query = {
          type: 'GetSecurityBlogPosts',
          parameters: {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Error in /security endpoint:', {
          error: error.message,
          stack: error.stack,
          query: req.query
        });
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Get IAM-related blog posts
  router.get('/iam',
    readLimiter, // 200 read requests per 15 minutes
    [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        // Validate queryBus is available
        if (!queryBus) {
          logger.error('QueryBus is not available');
          return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable'
          });
        }

        const query = {
          type: 'GetIAMBlogPosts',
          parameters: {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
          }
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Error in /iam endpoint:', {
          error: error.message,
          stack: error.stack,
          query: req.query,
          errorName: error.name
        });
        
        // Return 503 for service unavailable errors, 500 for other errors
        const statusCode = error.message.includes('handler') || 
                          error.message.includes('not available') ||
                          error.message.includes('connection') ? 503 : 500;
        
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(statusCode).json({
          success: false,
          message: isProduction 
            ? 'An error occurred while fetching IAM posts' 
            : error.message
        });
      }
    }
  );

  // Get blog statistics
  router.get('/stats',
    authenticate,
    authorize(['admin', 'editor']),
    async (req, res) => {
      try {
        const query = {
          type: 'GetBlogPostStats',
          parameters: {}
        };

        const result = await queryBus.execute(query);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  );

  // Generate blog post using AI
  router.post('/generate',
    writeLimiter, // 20 write operations per 15 minutes
    authenticate,
    [
      body('prompt').notEmpty().withMessage('Prompt is required'),
      body('prompt').isLength({ min: 10, max: 1000 }).withMessage('Prompt must be between 10 and 1000 characters'),
      body('categoryId').optional().isIn(['security', 'iam', 'ai', 'compliance']).withMessage('Invalid category'),
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { prompt, categoryId } = req.body;
        
        const command = {
          type: 'GenerateBlogPost',
          data: {
            prompt: prompt.trim(),
            categoryId: categoryId || null,
            authorId: req.user.id,
            authorName: req.user.name || 'Admin',
            authorEmail: req.user.email || 'admin@example.com'
          },
          metadata: {
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        };

        const result = await commandBus.execute(command);
        
        res.json({
          success: true,
          message: 'Blog post generated successfully',
          data: result
        });
      } catch (error) {
        logger.error('Error generating blog post:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to generate blog post'
        });
      }
    }
  );

  return router;
};
