const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IAM Cybersecurity Blog API',
      version: '1.0.0',
      description: 'API documentation for the IAM Cybersecurity Blog application',
      contact: {
        name: 'API Support',
        email: 'admin@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'adminToken',
          description: 'JWT token stored in HTTP-only cookie after login'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token (alternative to cookie auth)'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            requestId: {
              type: 'string',
              example: 'uuid-request-id'
            }
          }
        },
        BlogPost: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'post-123'
            },
            title: {
              type: 'string',
              example: 'Understanding IAM Best Practices'
            },
            content: {
              type: 'string',
              example: 'Full blog post content...'
            },
            excerpt: {
              type: 'string',
              example: 'Brief excerpt of the post'
            },
            slug: {
              type: 'string',
              example: 'understanding-iam-best-practices'
            },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['iam', 'security', 'best-practices']
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived', 'deleted'],
              example: 'published'
            },
            featuredImage: {
              type: 'object',
              nullable: true
            },
            metadata: {
              type: 'object',
              properties: {
                readingTime: { type: 'number' },
                wordCount: { type: 'number' },
                viewCount: { type: 'number' },
                likeCount: { type: 'number' }
              }
            },
            timestamps: {
              type: 'object',
              properties: {
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                publishedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        BlogPostList: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                posts: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BlogPost' }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number', example: 1 },
                    limit: { type: 'number', example: 10 },
                    total: { type: 'number', example: 50 },
                    pages: { type: 'number', example: 5 },
                    hasNext: { type: 'boolean' },
                    hasPrev: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        CreateBlogPostRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Understanding IAM Best Practices'
            },
            content: {
              type: 'string',
              minLength: 1,
              example: 'Full blog post content in markdown...'
            },
            excerpt: {
              type: 'string',
              maxLength: 500,
              example: 'Brief excerpt of the post'
            },
            categoryId: {
              type: 'string',
              enum: ['security', 'iam', 'ai', 'compliance'],
              example: 'iam'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['iam', 'security']
            },
            slug: {
              type: 'string',
              example: 'understanding-iam-best-practices'
            },
            featuredImage: {
              type: 'object',
              nullable: true
            },
            seoTitle: {
              type: 'string',
              example: 'SEO optimized title'
            },
            seoDescription: {
              type: 'string',
              example: 'SEO meta description'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'admin'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'your-password'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'user'] }
              }
            }
          }
        },
        AuthStatus: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            isAuthenticated: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        ContactMessage: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
            status: {
              type: 'string',
              enum: ['new', 'read', 'replied', 'archived']
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent']
            },
            submittedAt: { type: 'string', format: 'date-time' }
          }
        },
        ContactRequest: {
          type: 'object',
          required: ['name', 'email', 'subject', 'message'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            subject: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Question about IAM'
            },
            message: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              example: 'I have a question about...'
            }
          }
        },
        NewsletterSubscription: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            subscribedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Blog Posts',
        description: 'Blog post management and retrieval'
      },
      {
        name: 'Contact',
        description: 'Contact form and message management'
      },
      {
        name: 'Newsletter',
        description: 'Newsletter subscription management'
      },
      {
        name: 'Uploads',
        description: 'File upload endpoints'
      }
    ]
  },
  apis: [
    './src/backend/api/routes/*.js',
    './src/backend/api/routes/*.docs.js',
    './src/backend/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

