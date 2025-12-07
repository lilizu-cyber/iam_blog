const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Check if Redis is available for distributed rate limiting
let RedisStore = null;
let redisClient = null;
let redisConnectionAttempted = false;
let redisConnectionFailed = false;

// Try to set up Redis for distributed rate limiting (optional)
function initializeRedis() {
  // Only try once
  if (redisConnectionAttempted) {
    return;
  }
  redisConnectionAttempted = true;

  try {
    const redis = require('redis');
    const { RedisStore: Store } = require('rate-limit-redis');
    
    RedisStore = Store;
    
    // Only try to connect if REDIS_URL is set
    if (!process.env.REDIS_URL) {
      logger.debug('REDIS_URL not set, using memory store for rate limiting');
      return;
    }
    
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            // Stop reconnecting after 3 attempts to avoid log spam
            if (retries > 3) {
              if (!redisConnectionFailed) {
                logger.warn('Redis reconnection attempts exceeded, using memory store for rate limiting');
                redisConnectionFailed = true;
              }
              return false; // Stop reconnecting
            }
            return Math.min(retries * 100, 3000); // Exponential backoff
          },
          connectTimeout: 5000 // 5 second timeout
        }
      });
      
      // Only log errors once
      let errorLogged = false;
      redisClient.on('error', (err) => {
        if (!errorLogged && !redisConnectionFailed) {
          logger.warn('Redis connection error, using memory store for rate limiting:', err.message);
          errorLogged = true;
          redisConnectionFailed = true;
        }
      });
      
      redisClient.on('connect', () => {
        logger.info('Redis connected for rate limiting');
        redisConnectionFailed = false;
      });
      
      redisClient.on('ready', () => {
        logger.info('Redis ready for rate limiting');
        redisConnectionFailed = false;
      });
      
      // Connect to Redis (non-blocking, don't wait)
      redisClient.connect().catch((err) => {
        if (!redisConnectionFailed) {
          logger.warn('Redis connection failed, using memory store for rate limiting:', err.message);
          redisConnectionFailed = true;
        }
        redisClient = null;
      });
    } catch (error) {
      if (!redisConnectionFailed) {
        logger.warn('Redis not available, using memory store for rate limiting:', error.message);
        redisConnectionFailed = true;
      }
      redisClient = null;
    }
  } catch (error) {
    logger.debug('rate-limit-redis not available, using memory store for rate limiting');
  }
}

// Initialize Redis on module load
initializeRedis();

// Export Redis client for health checks
function getRedisClient() {
  return redisClient;
}

module.exports = {
  createRateLimiter,
  getRedisClient
};

/**
 * Create a rate limiter with Redis store if available, otherwise memory store
 */
function createRateLimiter(options) {
  // Use Redis store if available and connected, otherwise use memory store
  let store = undefined;
  
  // Only try to use Redis if it's available and not failed
  if (redisClient && RedisStore && !redisConnectionFailed) {
    // Check if Redis client is ready (connected)
    const isReady = redisClient.isReady || (redisClient.status === 'ready');
    
    if (isReady) {
      try {
        // For redis v4+, use the client directly
        store = new RedisStore({
          client: redisClient,
          prefix: 'rl:', // Optional: prefix for rate limit keys
        });
        // Only log once when first limiter is created with Redis
        if (!createRateLimiter._redisLogged) {
          logger.info('Using Redis store for rate limiting');
          createRateLimiter._redisLogged = true;
        }
      } catch (error) {
        if (!redisConnectionFailed) {
          logger.warn('Failed to create Redis store, using memory store:', error.message);
          redisConnectionFailed = true;
        }
        store = undefined;
      }
    }
  }
  
  // Use memory store if Redis is not available or failed
  if (!store && !createRateLimiter._memoryLogged) {
    logger.debug('Using memory store for rate limiting');
    createRateLimiter._memoryLogged = true;
  }

  return rateLimit({
    store,
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: options.max,
        windowMs: options.windowMs
      });
      
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready' || req.path === '/live';
    }
  });
}

// General API rate limiter (moderate limits)
const generalLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limiter for authentication endpoints (prevent brute force)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});

// Strict rate limiter for password reset and sensitive operations
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many attempts from this IP, please try again after 1 hour.'
});

// Moderate rate limiter for blog post creation/updates
const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 write operations per 15 minutes
  message: 'Too many write operations from this IP, please try again later.'
});

// Lenient rate limiter for read operations (blog posts, etc.)
const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 read requests per 15 minutes
  message: 'Too many read requests from this IP, please try again later.'
});

module.exports = {
  generalLimiter,
  authLimiter,
  strictLimiter,
  writeLimiter,
  readLimiter,
  createRateLimiter,
  getRedisClient
};

