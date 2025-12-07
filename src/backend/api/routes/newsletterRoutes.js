const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../../utils/logger');

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

module.exports = (commandBus, queryBus, readModelStore) => {
  // Newsletter subscription endpoint
  router.post('/subscribe',
    [
      body('email').isEmail().withMessage('Valid email is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { email } = req.body;
        
        logger.info('Newsletter subscription request received for:', email);
        
        // Check if already subscribed using ReadModelStore
        const existingSubscription = await readModelStore.findOne('NewsletterSubscription', { email });
        
        if (existingSubscription) {
          if (existingSubscription.status === 'active') {
            return res.status(400).json({
              success: false,
              message: 'Email is already subscribed to newsletter'
            });
          } else {
            // Reactivate subscription using ReadModelStore
            const updatedSubscription = await readModelStore.updateById('NewsletterSubscription', existingSubscription._id, {
              status: 'active',
              subscribedAt: new Date(),
              unsubscribedAt: null,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            });
            
            logger.info('Newsletter subscription reactivated for:', email);
            
            return res.status(200).json({
              success: true,
              message: 'Successfully resubscribed to newsletter',
              data: {
                email: updatedSubscription.email,
                subscribedAt: updatedSubscription.subscribedAt
              }
            });
          }
        }
        
        // Create new subscription using ReadModelStore
        const subscriptionData = {
          email,
          status: 'active',
          subscribedAt: new Date(),
          source: 'website',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        const subscription = await readModelStore.create('NewsletterSubscription', subscriptionData);
        
        logger.info('New newsletter subscription created for:', email);
        
        res.status(201).json({
          success: true,
          message: 'Successfully subscribed to newsletter',
          data: {
            email: subscription.email,
            subscribedAt: subscription.subscribedAt
          }
        });
        
      } catch (error) {
        logger.error('Newsletter subscription error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to subscribe to newsletter'
        });
      }
    }
  );

  // Unsubscribe from newsletter
  router.post('/unsubscribe',
    [
      body('email').isEmail().withMessage('Valid email is required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { email } = req.body;
        
        // Find subscription using ReadModelStore
        const subscription = await readModelStore.findOne('NewsletterSubscription', { email });
        
        if (!subscription || subscription.status === 'unsubscribed') {
          return res.status(404).json({
            success: false,
            message: 'Email not found or already unsubscribed'
          });
        }
        
        // Update subscription status using ReadModelStore
        await readModelStore.updateById('NewsletterSubscription', subscription._id, {
          status: 'unsubscribed',
          unsubscribedAt: new Date()
        });
        
        logger.info('Newsletter unsubscribed for:', email);
        
        res.status(200).json({
          success: true,
          message: 'Successfully unsubscribed from newsletter'
        });
        
      } catch (error) {
        logger.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to unsubscribe from newsletter'
        });
      }
    }
  );

  // Admin endpoint to get all subscribers
  router.get('/subscribers', async (req, res) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const query = {};
      
      if (status && ['active', 'unsubscribed'].includes(status)) {
        query.status = status;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get subscribers using ReadModelStore
      const subscribers = await readModelStore.find('NewsletterSubscription', query, {
        sort: { subscribedAt: -1 },
        skip,
        limit: parseInt(limit)
      });
      
      // Get counts using ReadModelStore
      const totalCount = await readModelStore.count('NewsletterSubscription', {});
      const activeCount = await readModelStore.count('NewsletterSubscription', { status: 'active' });
      const unsubscribedCount = await readModelStore.count('NewsletterSubscription', { status: 'unsubscribed' });
      const filteredCount = await readModelStore.count('NewsletterSubscription', query);
      
      logger.info(`Retrieved ${subscribers.length} newsletter subscribers`);
      
      res.status(200).json({
        success: true,
        data: {
          subscribers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredCount,
            pages: Math.ceil(filteredCount / parseInt(limit))
          },
          stats: {
            total: totalCount,
            active: activeCount,
            unsubscribed: unsubscribedCount
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to fetch newsletter subscribers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch newsletter subscribers'
      });
    }
  });

  return router;
};