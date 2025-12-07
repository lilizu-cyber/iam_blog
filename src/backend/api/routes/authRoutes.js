const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../../utils/logger');
const { getSequelize } = require('../../models/index');
const { getJWTSecret } = require('../../utils/jwtSecret');
const { authLimiter, strictLimiter, generalLimiter } = require('../../middleware/rateLimiter');

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

module.exports = () => {
  // Login endpoint - strict rate limiting to prevent brute force attacks
  // Apply rate limiter FIRST (before validation) to block attacks early
  router.post('/login',
    authLimiter, // 5 attempts per 15 minutes per IP
    [
      body('username').notEmpty().withMessage('Username is required'),
      body('password').notEmpty().withMessage('Password is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          logger.warn('Login attempt with missing credentials', { ip: req.ip });
          return res.status(400).json({
            success: false,
            message: 'Username and password are required'
          });
        }
        
        // Get User model - ensure it's properly initialized
        const userModule = require('../../models/User');
        let User;
        
        // Handle User model initialization (it might be null if Sequelize wasn't ready when module loaded)
        if (userModule && typeof userModule.sync === 'function') {
          // Already a model instance
          User = userModule;
        } else if (userModule && userModule.defineUserModel) {
          // Need to initialize using defineUserModel
          const { getSequelize } = require('../../models/index');
          const sequelize = getSequelize();
          User = userModule.defineUserModel(sequelize);
        } else if (typeof userModule === 'function') {
          // It's the getUserModel function
          User = userModule();
        } else {
          throw new Error('User model is not properly initialized');
        }
        
        if (!User || typeof User.findOne !== 'function') {
          throw new Error('User model is not a valid Sequelize model');
        }
        
        // Find user by username
        const user = await User.findOne({
          where: { 
            username: username.toLowerCase().trim(),
            isActive: true
          }
        });
        
        if (!user) {
          logger.warn('Login attempt with invalid username', { username, ip: req.ip });
          return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
          });
        }
        
        // Check password
        const isPasswordValid = await user.checkPassword(password);
        if (!isPasswordValid) {
          logger.warn('Login attempt with invalid password', { username, ip: req.ip });
          return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
          });
        }
        
        // Check if user has admin role
        if (user.role !== 'admin') {
          logger.warn('Login attempt by non-admin user', { username, role: user.role, ip: req.ip });
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
          });
        }
        
        // Update last login time
        await user.update({ lastLoginAt: new Date() });
        
        // Get validated JWT secret
        const JWT_SECRET = getJWTSecret();
        
        // Generate JWT token
        let token;
        try {
          token = jwt.sign(
            { 
              userId: user.userId,
              username: user.username,
              role: user.role,
              loginTime: new Date().toISOString()
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );
        } catch (jwtError) {
          logger.error('JWT token generation failed', { error: jwtError.message, stack: jwtError.stack });
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Failed to generate authentication token'
            });
          }
        }
        
        // Set HTTP-only cookie
        try {
          res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
        } catch (cookieError) {
          logger.error('Failed to set authentication cookie', { error: cookieError.message, stack: cookieError.stack });
          // Continue even if cookie fails - token is still generated
        }
        
        logger.info('Login successful', { username: user.username, userId: user.userId, ip: req.ip });
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            id: user.userId,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
        
      } catch (error) {
        logger.error('Login endpoint error', {
          error: error.message,
          stack: error.stack,
          ip: req.ip,
          username: req.body?.username,
          errorName: error.name
        });
        // Ensure we always send a JSON response
        if (!res.headersSent) {
          // Provide more helpful error message in development
          const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Internal server error: ${error.message}` 
            : 'Internal server error during login';
          res.status(500).json({
            success: false,
            message: errorMessage
          });
        }
      }
    }
  );

  // Token refresh endpoint
  router.post('/refresh',
    generalLimiter, // Apply rate limiting
    async (req, res) => {
      try {
        const token = req.cookies && (req.cookies.adminToken || req.cookies.token);
        
        if (!token) {
          return res.status(401).json({
            success: false,
            message: 'No token provided',
            code: 'NO_TOKEN'
          });
        }

        const JWT_SECRET = getJWTSecret();
        let decoded;
        
        try {
          // Try to verify token (even if expired, we'll check expiration separately)
          decoded = jwt.decode(token);
          
          if (!decoded) {
            return res.status(401).json({
              success: false,
              message: 'Invalid token format',
              code: 'INVALID_TOKEN'
            });
          }

          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp < now) {
            return res.status(401).json({
              success: false,
              message: 'Token has expired. Please login again.',
              code: 'TOKEN_EXPIRED'
            });
          }

          // Verify token signature (even if close to expiring)
          try {
            jwt.verify(token, JWT_SECRET);
          } catch (verifyError) {
            if (verifyError.name === 'TokenExpiredError') {
              return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
              });
            }
            throw verifyError;
          }

          // Get user from database to ensure they still exist and are active
          const userModule = require('../../models/User');
          let User;

          if (userModule && typeof userModule.sync === 'function') {
            User = userModule;
          } else if (userModule && userModule.defineUserModel) {
            const { getSequelize } = require('../../models/index');
            const sequelize = getSequelize();
            User = userModule.defineUserModel(sequelize);
          } else if (typeof userModule === 'function') {
            User = userModule();
          } else {
            throw new Error('User model is not properly initialized');
          }

          if (!User || typeof User.findByPk !== 'function') {
            throw new Error('User model is not a valid Sequelize model');
          }

          const user = await User.findByPk(decoded.userId);
          
          if (!user || !user.isActive || user.role !== 'admin') {
            return res.status(401).json({
              success: false,
              message: 'User account is inactive or no longer has admin privileges',
              code: 'USER_INACTIVE'
            });
          }

          // Generate new token
          const newToken = jwt.sign(
            {
              userId: user.userId,
              username: user.username,
              role: user.role,
              loginTime: decoded.loginTime || new Date().toISOString()
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          );

          // Calculate maxAge from JWT_EXPIRES_IN
          const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
          let maxAge = 7 * 24 * 60 * 60 * 1000; // Default: 7 days
          if (expiresIn.endsWith('d')) {
            const days = parseInt(expiresIn);
            maxAge = days * 24 * 60 * 60 * 1000;
          } else if (expiresIn.endsWith('h')) {
            const hours = parseInt(expiresIn);
            maxAge = hours * 60 * 60 * 1000;
          } else if (expiresIn.endsWith('m')) {
            const minutes = parseInt(expiresIn);
            maxAge = minutes * 60 * 1000;
          }

          // Set new token in cookie
          res.cookie('adminToken', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: maxAge
          });

          logger.info('Token refreshed successfully', {
            username: user.username,
            userId: user.userId,
            ip: req.ip
          });

          return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
              id: user.userId,
              username: user.username,
              email: user.email,
              role: user.role
            }
          });

        } catch (jwtError) {
          logger.warn('Token refresh failed', {
            error: jwtError.message,
            ip: req.ip
          });
          
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        }

      } catch (error) {
        logger.error('Token refresh endpoint error', {
          error: error.message,
          stack: error.stack,
          ip: req.ip
        });
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Internal server error during token refresh'
          });
        }
      }
    }
  );

  // Logout endpoint
  router.post('/logout', (req, res) => {
    try {
      // Clear the cookie
      try {
        res.clearCookie('adminToken');
      } catch (cookieError) {
        logger.warn('Failed to clear cookie during logout', { error: cookieError.message });
      }
      
      logger.info('Logout successful', { ip: req.ip });
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout endpoint error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip
      });
      // Ensure we always send a JSON response
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during logout'
        });
      }
    }
  });

  // Check authentication status
  router.get('/me', 
    generalLimiter, // Apply rate limiting
    async (req, res) => {
    try {
      // Safely access cookies
      let token = null;
      try {
        token = req.cookies && (req.cookies.adminToken || req.cookies.token);
      } catch (cookieError) {
        logger.warn('Error reading cookies in /me endpoint', { error: cookieError.message });
      }
      
      if (!token) {
        return res.status(200).json({
          success: false,
          isAuthenticated: false,
          message: 'Not authenticated'
        });
      }
      
      // Get validated JWT secret
      const JWT_SECRET = getJWTSecret();
      
      // Verify token
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Optionally fetch fresh user data from database
        const userModule = require('../../models/User');
        let User;
        
        // Handle User model initialization (it might be null if Sequelize wasn't ready when module loaded)
        if (userModule && typeof userModule.sync === 'function') {
          // Already a model instance
          User = userModule;
        } else if (userModule && userModule.defineUserModel) {
          // Need to initialize using defineUserModel
          const { getSequelize } = require('../../models/index');
          const sequelize = getSequelize();
          User = userModule.defineUserModel(sequelize);
        } else if (typeof userModule === 'function') {
          // It's the getUserModel function
          User = userModule();
        } else {
          throw new Error('User model is not properly initialized');
        }
        
        // Try to fetch user from database, but don't block if it fails
        // Return user info from token if database query fails or times out
        let user = null;
        try {
          if (!User || typeof User.findByPk !== 'function') {
            logger.warn('User model not available, using token data');
          } else {
            // Add timeout to database query (5 seconds)
            const userQuery = Promise.race([
              User.findByPk(decoded.userId || decoded.username),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 5000)
              )
            ]);
            user = await userQuery;
          }
        } catch (dbError) {
          logger.warn('Database query failed in /me endpoint, using token data', {
            error: dbError.message
          });
          // Continue with token data if database query fails
        }
        
        // If user found in database and is inactive, return error
        if (user && !user.isActive) {
          return res.status(200).json({
            success: false,
            isAuthenticated: false,
            message: 'User account is inactive or deleted'
          });
        }
        
        // Check if token is close to expiring (within 1 day) and auto-refresh
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp ? (decoded.exp - now) : null;
        const oneDayInSeconds = 24 * 60 * 60;
        
        let responseData = {
          success: true,
          isAuthenticated: true,
          data: {
            id: user?.userId || decoded.userId || decoded.username,
            username: user?.username || decoded.username,
            email: user?.email || decoded.email,
            role: user?.role || decoded.role,
            loginTime: decoded.loginTime
          }
        };

        // Auto-refresh token if it expires within 1 day
        if (timeUntilExpiry && timeUntilExpiry < oneDayInSeconds && timeUntilExpiry > 0) {
          try {
            const currentUser = user || {
              userId: decoded.userId,
              username: decoded.username,
              role: decoded.role
            };

            const newToken = jwt.sign(
              {
                userId: currentUser.userId,
                username: currentUser.username,
                role: currentUser.role,
                loginTime: decoded.loginTime
              },
              JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Calculate maxAge from JWT_EXPIRES_IN
            const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
            let maxAge = 7 * 24 * 60 * 60 * 1000;
            if (expiresIn.endsWith('d')) {
              const days = parseInt(expiresIn);
              maxAge = days * 24 * 60 * 60 * 1000;
            } else if (expiresIn.endsWith('h')) {
              const hours = parseInt(expiresIn);
              maxAge = hours * 60 * 60 * 1000;
            } else if (expiresIn.endsWith('m')) {
              const minutes = parseInt(expiresIn);
              maxAge = minutes * 60 * 1000;
            }

            res.cookie('adminToken', newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: maxAge
            });

            responseData.tokenRefreshed = true;
            logger.debug('Token auto-refreshed in /me endpoint', {
              username: currentUser.username,
              timeUntilExpiry: timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 3600)} hours` : 'unknown'
            });
          } catch (refreshError) {
            logger.warn('Failed to auto-refresh token in /me endpoint', {
              error: refreshError.message
            });
            // Continue with existing token
          }
        }

        // Return user data (from database if available, otherwise from token)
        return res.status(200).json(responseData);
      } catch (jwtError) {
        // Token is invalid or expired
        logger.debug('Token verification failed', { error: jwtError.message });
        return res.status(200).json({
          success: false,
          isAuthenticated: false,
          message: 'Invalid or expired token'
        });
      }
      
    } catch (error) {
      logger.error('Auth check endpoint error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip
      });
      
      // Determine if this is a service unavailability error
      const isServiceUnavailable = error.message.includes('timeout') ||
                                   error.message.includes('connection') ||
                                   error.message.includes('ECONNREFUSED') ||
                                   error.message.includes('not available');
      
      // Ensure we always send a JSON response
      if (!res.headersSent) {
        const statusCode = isServiceUnavailable ? 503 : 500;
        res.status(statusCode).json({
          success: false,
          isAuthenticated: false,
          message: isServiceUnavailable
            ? 'Service temporarily unavailable'
            : 'Internal server error during authentication check'
        });
      }
    }
  });

  return router;
};
