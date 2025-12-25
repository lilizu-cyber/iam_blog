require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Infrastructure
const PostgresEventStore = require('./infrastructure/PostgresEventStore');
const ReadModelStore = require('./infrastructure/ReadModelStore');
const { CommandBus } = require('./infrastructure/CommandBus');
const { QueryBus } = require('./infrastructure/QueryBus');
const { EventBus } = require('./infrastructure/EventBus');

// Note: Models are now auto-registered via Sequelize in ReadModelStore.connect()

// Command Handlers
const BlogPostCommandHandlers = require('./application/commandHandlers/BlogPostCommandHandlers');

// Query Handlers
const BlogPostQueryHandlers = require('./application/queryHandlers/BlogPostQueryHandlers');

// Projections
const BlogPostProjection = require('./readModels/projections/BlogPostProjection');

// Routes
const blogRoutes = require('./api/routes/blogRoutes');
const newsletterRoutes = require('./api/routes/newsletterRoutes');
const authRoutes = require('./api/routes/authRoutes');
const contactRoutes = require('./api/routes/contactRoutes');
const uploadRoutes = require('./api/routes/uploadRoutes');
const analyticsRoutes = require('./api/routes/analyticsRoutes');

// Utils
const logger = require('./utils/logger');
const { validateJWTSecretOnStartup } = require('./utils/jwtSecret');
const { validateEnvVars } = require('./config/env');
const performanceMonitor = require('./middleware/performanceMonitor');
const apmIntegrations = require('./utils/apmIntegrations');
const errorTracker = require('./utils/errorTracker');

// Rate Limiting
const { generalLimiter, authLimiter, writeLimiter, readLimiter, getRedisClient } = require('./middleware/rateLimiter');

// Timeout Middleware
const { requestTimeout } = require('./middleware/timeoutMiddleware');

// Health Check
const HealthChecker = require('./utils/healthCheck');

// Database Monitoring
const DatabaseMonitor = require('./utils/databaseMonitor');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    // Infrastructure instances
    this.eventStore = null;
    this.readModelStore = null;
    this.commandBus = null;
    this.queryBus = null;
    this.eventBus = null;
    
    // Handlers
    this.blogPostCommandHandlers = null;
    this.blogPostQueryHandlers = null;
    
    // Projections
    this.blogPostProjection = null;
  }

  async initialize() {
    try {
      logger.info('Initializing server...');

      // Validate environment variables on startup (must be done first)
      validateEnvVars();
      
      // Validate JWT_SECRET on startup (must be done before routes are set up)
      validateJWTSecretOnStartup();

      // Initialize infrastructure
      await this.initializeInfrastructure();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Register handlers
      this.registerHandlers();
      
      // Setup projections
      this.setupProjections();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('Server initialization completed');
    } catch (error) {
      logger.error('Server initialization failed:', error);
      throw error;
    }
  }

  async initializeInfrastructure() {
    logger.info('Initializing infrastructure components...');

    // Initialize Event Store (PostgreSQL-based)
    // Log environment variables for debugging (without sensitive data)
    logger.info('Checking database connection configuration...', {
      hasPostgresqlUri: !!process.env.POSTGRESQL_URI,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      postgresqlUriLength: process.env.POSTGRESQL_URI ? process.env.POSTGRESQL_URI.length : 0,
      databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    });
    
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
    
    // Validate connection string before attempting connection
    if (!postgresUri) {
      const error = new Error(
        'POSTGRESQL_URI or DATABASE_URL is not set. ' +
        'Please set POSTGRESQL_URI in Railway environment variables. ' +
        'Go to Railway Dashboard → Your Service → Variables → Add POSTGRESQL_URI'
      );
      logger.error('Database connection string validation failed:', error.message);
      throw error;
    }
    
    if (typeof postgresUri !== 'string') {
      const error = new Error(
        `POSTGRESQL_URI must be a string. Got type: ${typeof postgresUri}`
      );
      logger.error('Database connection string validation failed:', error.message);
      throw error;
    }
    
    if (postgresUri.trim() === '') {
      const error = new Error(
        'POSTGRESQL_URI is set but is empty. ' +
        'Please set a valid PostgreSQL connection string in Railway environment variables.'
      );
      logger.error('Database connection string validation failed:', error.message);
      throw error;
    }
    
    // Validate connection string format
    if (!postgresUri.startsWith('postgresql://') && !postgresUri.startsWith('postgres://')) {
      const error = new Error(
        `Invalid database connection string format. Must start with 'postgresql://' or 'postgres://'. ` +
        `Got: ${postgresUri.substring(0, 50)}... (length: ${postgresUri.length})`
      );
      logger.error('Database connection string format validation failed:', error.message);
      throw error;
    }
    
    logger.info('Database connection string validated successfully', {
      uriLength: postgresUri.length,
      startsWith: postgresUri.substring(0, 20) + '...'
    });
    
    // Retry connection with better error messages
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.eventStore = new PostgresEventStore(postgresUri);
        await this.eventStore.connect();
        
        // Wrap Sequelize instance for monitoring
        if (this.eventStore.sequelize && DatabaseMonitor) {
          DatabaseMonitor.wrapQuery(this.eventStore.sequelize);
        }
        
        break;
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error('Failed to connect to PostgreSQL Event Store after multiple attempts');
          if (error.message.includes('ECONNREFUSED')) {
            logger.error('PostgreSQL is not running. Start it with: docker-compose up -d postgresql');
          }
          throw error;
        }
        logger.warn(`PostgreSQL connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`, {
          error: error.message,
          code: error.code
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Small delay between Event Store and Read Model Store connections
    // to avoid connection pool contention
    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize Read Model Store (PostgreSQL-based)
    // Models are auto-registered via Sequelize when connect() is called
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.readModelStore = new ReadModelStore(postgresUri);
        await this.readModelStore.connect();
        
        // Wrap Sequelize instance for monitoring
        if (this.readModelStore.sequelize && DatabaseMonitor) {
          DatabaseMonitor.wrapQuery(this.readModelStore.sequelize);
        }
        
        break;
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error('Failed to connect to PostgreSQL Read Model Store after multiple attempts');
          if (error.message.includes('ECONNREFUSED')) {
            logger.error('PostgreSQL is not running. Start it with: docker-compose up -d postgresql');
          }
          throw error;
        }
        logger.warn(`PostgreSQL Read Model connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`, {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    // Initialize buses
    this.commandBus = new CommandBus();
    this.queryBus = new QueryBus();
    this.eventBus = new EventBus();

    // Initialize handlers
    this.blogPostCommandHandlers = new BlogPostCommandHandlers(this.eventStore, this.eventBus);
    this.blogPostQueryHandlers = new BlogPostQueryHandlers(this.readModelStore);

    // Initialize projections
    this.blogPostProjection = new BlogPostProjection(this.readModelStore);

    logger.info('Infrastructure components initialized');
  }

  setupMiddleware() {
    logger.info('Setting up middleware...');

    // Performance monitoring (should be early in the middleware chain)
    this.app.use(performanceMonitor.middleware());

    // Request timeout - prevent requests from hanging indefinitely
    // Must be early in middleware chain to catch all requests
    this.app.use(requestTimeout());

    // Rate limiting - apply general limiter to all routes
    // Specific routes will override with stricter limits
    this.app.use('/api', generalLimiter);

    // Security middleware - comprehensive production-ready configuration
    const { applySecurityHeaders, getCSPReportHandler } = require('./config/securityHeaders');
    applySecurityHeaders(this.app);
    
    // Optional: CSP violation reporting endpoint (for monitoring)
    // Uncomment if you want to collect CSP violation reports
    // this.app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), getCSPReportHandler());

    // CORS - Allow production and preview Vercel URLs, plus custom domain
    const allowedOrigins = [];
    
    if (process.env.NODE_ENV === 'production') {
      // Production Vercel URL
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      // Allow all Vercel preview deployments (for PR previews)
      allowedOrigins.push(/^https:\/\/.*\.vercel\.app$/);
      // Allow custom domain cyberiam.blog
      allowedOrigins.push('https://cyberiam.blog');
      allowedOrigins.push(/^https:\/\/.*\.cyberiam\.blog$/);
    } else {
      // Development
      allowedOrigins.push('http://localhost:3000');
    }
    
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return origin === allowed;
          }
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Input sanitization (after body parsing, before routes)
    const { sanitizeQuery, sanitizeParams } = require('./middleware/sanitizeMiddleware');
    const { sqlInjectionCheckMiddleware } = require('./utils/sqlInjectionCheck');
    this.app.use(sanitizeQuery);
    this.app.use(sanitizeParams);
    this.app.use(sqlInjectionCheckMiddleware); // Log SQL injection attempts (Sequelize prevents them)
    
    // Cookie parsing
    this.app.use(cookieParser());

    // Logging
    this.app.use(morgan('combined', { stream: logger.stream }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = require('uuid').v4();
      res.setHeader('X-Request-ID', req.id);
      
      // Set request ID in error tracker
      if (errorTracker.sentry) {
        errorTracker.sentry.setTag('requestId', req.id);
      }
      
      // Add breadcrumb for request
      errorTracker.addBreadcrumb(
        `${req.method} ${req.path}`,
        'http',
        'info',
        {
          method: req.method,
          path: req.path,
          requestId: req.id
        }
      );
      
      next();
    });

    // Request timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      next();
    });

    logger.info('Middleware setup completed');
  }

  registerHandlers() {
    logger.info('Registering command and query handlers...');

    // Register command handlers
    this.commandBus.registerHandler('CreateBlogPost', 
      this.blogPostCommandHandlers.handleCreateBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('UpdateBlogPost', 
      this.blogPostCommandHandlers.handleUpdateBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('PublishBlogPost', 
      this.blogPostCommandHandlers.handlePublishBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('UnpublishBlogPost', 
      this.blogPostCommandHandlers.handleUnpublishBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('DeleteBlogPost', 
      this.blogPostCommandHandlers.handleDeleteBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('AddTagToBlogPost', 
      this.blogPostCommandHandlers.handleAddTagToBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('RemoveTagFromBlogPost', 
      this.blogPostCommandHandlers.handleRemoveTagFromBlogPost.bind(this.blogPostCommandHandlers));
    this.commandBus.registerHandler('GenerateBlogPost', 
      this.blogPostCommandHandlers.handleGenerateBlogPost.bind(this.blogPostCommandHandlers));

    // Register query handlers
    this.queryBus.registerHandler('GetBlogPostById', 
      this.blogPostQueryHandlers.handleGetBlogPostById.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetBlogPostBySlug', 
      this.blogPostQueryHandlers.handleGetBlogPostBySlug.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetPublishedBlogPosts', 
      this.blogPostQueryHandlers.handleGetPublishedBlogPosts.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetBlogPostsByAuthor', 
      this.blogPostQueryHandlers.handleGetBlogPostsByAuthor.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetBlogPostsByCategory', 
      this.blogPostQueryHandlers.handleGetBlogPostsByCategory.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetBlogPostsByTag', 
      this.blogPostQueryHandlers.handleGetBlogPostsByTag.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('SearchBlogPosts', 
      this.blogPostQueryHandlers.handleSearchBlogPosts.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetPopularBlogPosts', 
      this.blogPostQueryHandlers.handleGetPopularBlogPosts.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetSecurityBlogPosts', 
      this.blogPostQueryHandlers.handleGetSecurityBlogPosts.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetIAMBlogPosts', 
      this.blogPostQueryHandlers.handleGetIAMBlogPosts.bind(this.blogPostQueryHandlers));
    this.queryBus.registerHandler('GetBlogPostStats', 
      this.blogPostQueryHandlers.handleGetBlogPostStats.bind(this.blogPostQueryHandlers));

    logger.info('Command and query handlers registered');
  }

  setupProjections() {
    logger.info('Setting up projections...');

    // Register blog post projection
    this.eventBus.registerProjection('BlogPostProjection', [
      'BlogPostCreated',
      'BlogPostUpdated',
      'BlogPostPublished',
      'BlogPostUnpublished',
      'BlogPostDeleted',
      'TagAddedToBlogPost',
      'TagRemovedFromBlogPost',
      'BlogPostViewed',
      'UserRegistered',
      'UserProfileUpdated'
    ], async (event, metadata) => {
      try {
        // Log event received for debugging
        logger.debug('BlogPostProjection received event', { 
          type: event?.type, 
          eventId: event?.eventId,
          hasData: !!event?.data 
        });
        
        if (!event || !event.type) {
          logger.error('Invalid event received in BlogPostProjection', { event, metadata });
          return;
        }
        
        switch (event.type) {
          case 'BlogPostCreated':
            await this.blogPostProjection.onBlogPostCreated(event);
            break;
          case 'BlogPostUpdated':
            await this.blogPostProjection.onBlogPostUpdated(event);
            break;
          case 'BlogPostPublished':
            await this.blogPostProjection.onBlogPostPublished(event);
            break;
          case 'BlogPostUnpublished':
            await this.blogPostProjection.onBlogPostUnpublished(event);
            break;
          case 'BlogPostDeleted':
            await this.blogPostProjection.onBlogPostDeleted(event);
            break;
          case 'TagAddedToBlogPost':
            await this.blogPostProjection.onTagAddedToBlogPost(event);
            break;
          case 'TagRemovedFromBlogPost':
            await this.blogPostProjection.onTagRemovedFromBlogPost(event);
            break;
          case 'BlogPostViewed':
            await this.blogPostProjection.onBlogPostViewed(event);
            break;
          case 'UserRegistered':
            await this.blogPostProjection.onUserRegistered(event);
            break;
          case 'UserProfileUpdated':
            await this.blogPostProjection.onUserProfileUpdated(event);
            break;
          default:
            logger.debug('BlogPostProjection ignoring event type', { type: event.type });
        }
      } catch (error) {
        logger.error('Error in BlogPostProjection:', {
          error: error.message,
          stack: error.stack,
          eventType: event?.type,
          eventId: event?.eventId,
          postId: event?.data?.postId
        });
        // Don't throw - we want other projections to continue
      }
    });

    logger.info('Projections setup completed');
  }

  setupRoutes() {
    logger.info('Setting up routes...');

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Initialize health checker
        const healthChecker = new HealthChecker(
          this.eventStore,
          this.readModelStore,
          getRedisClient()
        );

        // Perform comprehensive health check
        const health = await healthChecker.performHealthCheck();

        // Set appropriate status code
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check endpoint error:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          services: {}
        });
      }
    });

    // Readiness endpoint (for Kubernetes/Docker)
    this.app.get('/ready', async (req, res) => {
      try {
        const healthChecker = new HealthChecker(
          this.eventStore,
          this.readModelStore,
          getRedisClient()
        );

        const health = await healthChecker.performHealthCheck();
        
        // Readiness requires all critical services to be healthy
        const isReady = health.status === 'healthy' && 
                      health.services.database?.status === 'healthy' &&
                      health.services.eventStore?.status === 'healthy';

        res.status(isReady ? 200 : 503).json({
          ready: isReady,
          status: health.status,
          timestamp: health.timestamp
        });
      } catch (error) {
        res.status(503).json({
          ready: false,
          error: error.message
        });
      }
    });

    // Liveness endpoint (for Kubernetes/Docker)
    this.app.get('/live', (req, res) => {
      // Simple liveness check - just verify the process is running
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Metrics endpoint (for monitoring)
    this.app.get('/metrics', (req, res) => {
      try {
        const metrics = performanceMonitor.getSummary();
        res.status(200).json(metrics);
      } catch (error) {
        logger.error('Error getting metrics:', error);
        res.status(500).json({
          error: 'Failed to retrieve metrics'
        });
      }
    });

    // Detailed metrics endpoint
    this.app.get('/metrics/detailed', (req, res) => {
      try {
        const metrics = performanceMonitor.getMetrics();
        res.status(200).json(metrics);
      } catch (error) {
        logger.error('Error getting detailed metrics:', error);
        res.status(500).json({
          error: 'Failed to retrieve detailed metrics'
        });
      }
    });

    // API routes
    this.app.use('/api/blog', blogRoutes(this.commandBus, this.queryBus, this.readModelStore));
    this.app.use('/api/newsletter', newsletterRoutes(this.commandBus, this.queryBus, this.readModelStore));
    // API Documentation (Swagger)
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
      try {
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpec = require('./config/swagger');
        
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
          customCss: '.swagger-ui .topbar { display: none }',
          customSiteTitle: 'IAM Blog API Documentation'
        }));
        
        // JSON endpoint for OpenAPI spec
        this.app.get('/api-docs.json', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(swaggerSpec);
        });
        
        logger.info('API documentation available at /api-docs');
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          logger.warn('Swagger packages not installed. API documentation disabled. Run "npm install" to enable.');
          logger.warn('Missing packages: swagger-ui-express, swagger-jsdoc');
        } else {
          logger.error('Failed to setup API documentation:', error);
        }
      }
    }

    this.app.use('/api/auth', authRoutes());
    this.app.use('/api/analytics', analyticsRoutes(this.commandBus));
    this.app.use('/api/contact', contactRoutes(this.commandBus, this.queryBus, this.readModelStore));
    this.app.use('/api/upload', uploadRoutes());
    
    // SEO routes (sitemap, robots.txt)
    const seoRoutes = require('./api/routes/seoRoutes');
    this.app.use('/', seoRoutes(this.readModelStore));
    
    // Serve uploaded files statically
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../../frontend/build')));
      
      // Catch-all handler: send back React's index.html file (SPA routing)
      // Must be last route - placed after all API routes
      this.app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../frontend/build/index.html'));
      });
    }

    logger.info('Routes setup completed');
  }

  setupErrorHandling() {
    logger.info('Setting up error handling...');

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      const duration = Date.now() - (req.startTime || Date.now());
      
      // Track error with APM integrations
      apmIntegrations.trackError(error, {
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          requestId: req.id
        }
      });

      // Track error with error tracker (Sentry/Rollbar)
      errorTracker.captureError(error, {
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          requestId: req.id,
          ip: req.ip,
          userAgent: req.get('user-agent')
        },
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email
        } : null,
        tags: {
          route: req.route?.path || req.path,
          method: req.method,
          statusCode: error.status || 500
        }
      });

      // Track error in performance monitor
      performanceMonitor.recordError({
        type: 'server_error',
        statusCode: error.status || 500,
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack,
        duration
      });

      // Track HTTP request with APM
      apmIntegrations.trackHttpRequest(
        req.method,
        req.path,
        error.status || 500,
        duration,
        error
      );
      
      // Always log full error details (for debugging and monitoring)
      // This is safe because logs are server-side only
      logger.error('Request failed:', {
        requestId: req.id,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });

      // In production, hide error details from client to prevent information disclosure
      // In development, show error details for debugging
      const response = {
        success: false,
        message: isProduction 
          ? 'Internal server error' 
          : error.message,
        requestId: req.id
      };
      
      // Never expose stack traces in responses, even in development
      // Stack traces should only be in logs, not client responses
      // Uncomment below only for local debugging (not recommended)
      // if (!isProduction) {
      //   response.stack = error.stack;
      // }
      
      res.status(error.status || 500).json(response);
    });

    logger.info('Error handling setup completed');
  }

  async start() {
    try {
      await this.initialize();
      
      // Add unhandled error listeners before starting server
      this.setupErrorHandlers();
      
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupErrorHandlers() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      logger.error('Unhandled Rejection at:', {
        promise,
        reason: error.message,
        stack: error.stack
      });
      
      // Track with error tracker
      errorTracker.captureError(error, {
        type: 'unhandledRejection',
        promise: String(promise),
        fatal: false
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack
      });
      
      // Track with error tracker
      errorTracker.captureError(error, {
        type: 'uncaughtException',
        fatal: true
      });
      
      // For uncaught exceptions, we should exit after logging
      // Give time for error to be sent to tracking service
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle warnings
    process.on('warning', (warning) => {
      logger.warn('Process Warning:', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          if (this.eventStore) {
            await this.eventStore.disconnect();
          }
          
          if (this.readModelStore) {
            await this.readModelStore.disconnect();
          }
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
