const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { body, validationResult } = require('express-validator');
const { generalLimiter } = require('../../middleware/rateLimiter');

// Helper to handle validation errors
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

module.exports = (commandBus) => {
  // Track page view
  router.post('/pageview',
    generalLimiter, // Rate limit analytics requests
    [
      body('path').optional().isString(),
      body('title').optional().isString(),
      body('referrer').optional().isString(),
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { path, title, referrer, postId } = req.body;
        
        // If postId is provided, use the existing TrackPageView command
        if (postId) {
          const viewCommand = {
            type: 'TrackPageView',
            data: {
              postId,
              userId: req.user?.id,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              path,
              referrer
            },
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'analytics-api'
            }
          };
          
          // Fire and forget
          commandBus.execute(viewCommand).catch(error => {
            logger.error('Error tracking page view:', error);
          });
        }
        
        // Always return success (fire and forget pattern)
        res.status(200).json({
          success: true,
          message: 'Page view tracked'
        });
      } catch (error) {
        logger.error('Error in /analytics/pageview:', error);
        // Still return success to not break user experience
        res.status(200).json({
          success: true,
          message: 'Page view tracking attempted'
        });
      }
    }
  );

  // Track user engagement
  router.post('/engagement',
    generalLimiter,
    [
      body('action').isString().notEmpty().withMessage('Action is required'),
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { action, postId, ...otherData } = req.body;
        
        // For now, just log engagement events
        // TODO: Implement TrackUserEngagement command handler if needed
        logger.debug('User engagement tracked', {
          action,
          postId,
          userId: req.user?.id,
          path: req.body.path || req.path,
          ipAddress: req.ip
        });
        
        // Fire and forget - don't execute command if handler doesn't exist
        // This prevents 500 errors if the handler isn't registered
        // commandBus.execute(engagementCommand).catch(error => {
        //   logger.error('Error tracking engagement:', error);
        // });
        
        res.status(200).json({
          success: true,
          message: 'Engagement tracked'
        });
      } catch (error) {
        logger.error('Error in /analytics/engagement:', error);
        res.status(200).json({
          success: true,
          message: 'Engagement tracking attempted'
        });
      }
    }
  );

  return router;
};

