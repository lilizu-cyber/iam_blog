const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../../utils/logger');
const { sanitizeContactForm } = require('../../middleware/sanitizeMiddleware');

// Middleware for handling validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Contact form validation failed:', {
      body: req.body,
      errors: errors.array()
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = (commandBus, queryBus, readModelStore) => {
  // Submit contact form
  router.post('/send',
    sanitizeContactForm, // Sanitize input
    [
      body('name').notEmpty().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('subject').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
      body('message').notEmpty().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        logger.info('Contact form submission received:', {
          body: req.body,
          headers: req.headers['content-type']
        });
        
        const { name, email, subject, message } = req.body;
        
        logger.info('Contact form submission received from:', email);
        
        // Create contact message using ReadModelStore
        const contactMessageData = {
          name,
          email,
          subject,
          message,
          status: 'new',
          priority: 'normal',
          submittedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          source: 'website'
        };
        
        const contactMessage = await readModelStore.create('ContactMessage', contactMessageData);
        
        logger.info('Contact message created successfully:', {
          id: contactMessage.id,
          email: contactMessage.email,
          subject: contactMessage.subject
        });
        
        res.status(201).json({
          success: true,
          message: 'Message sent successfully! We\'ll get back to you soon.',
          data: {
            id: contactMessage.id,
            submittedAt: contactMessage.submittedAt || contactMessage.submitted_at
          }
        });
        
      } catch (error) {
        logger.error('Contact form submission error:', {
          error: error.message,
          stack: error.stack,
          body: req.body,
          errorName: error.name
        });
        res.status(500).json({
          success: false,
          message: process.env.NODE_ENV === 'production' 
            ? 'Failed to send message. Please try again.'
            : `Failed to send message: ${error.message}`
        });
      }
    }
  );

  // Admin endpoint to get all contact messages
  router.get('/messages', async (req, res) => {
    try {
      const { status, priority, page = 1, limit = 20 } = req.query;
      const query = {};
      
      if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
        query.status = status;
      }
      
      if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
        query.priority = priority;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get contact messages using ReadModelStore
      const messages = await readModelStore.find('ContactMessage', query, {
        sort: { submittedAt: -1 },
        skip,
        limit: parseInt(limit)
      });
      
      // Get counts using ReadModelStore
      const totalCount = await readModelStore.count('ContactMessage', {});
      const newCount = await readModelStore.count('ContactMessage', { status: 'new' });
      const readCount = await readModelStore.count('ContactMessage', { status: 'read' });
      const repliedCount = await readModelStore.count('ContactMessage', { status: 'replied' });
      const archivedCount = await readModelStore.count('ContactMessage', { status: 'archived' });
      const filteredCount = await readModelStore.count('ContactMessage', query);
      
      logger.info(`Retrieved ${messages.length} contact messages`);
      
      res.status(200).json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredCount,
            pages: Math.ceil(filteredCount / parseInt(limit))
          },
          stats: {
            total: totalCount,
            new: newCount,
            read: readCount,
            replied: repliedCount,
            archived: archivedCount
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to fetch contact messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact messages'
      });
    }
  });

  // Admin endpoint to get a single contact message
  router.get('/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const message = await readModelStore.findById('ContactMessage', id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Contact message not found'
        });
      }
      
      // Mark as read if it's new
      if (message.status === 'new') {
        await readModelStore.updateById('ContactMessage', id, {
          status: 'read',
          readAt: new Date()
        });
        message.status = 'read';
        message.readAt = new Date();
      }
      
      res.status(200).json({
        success: true,
        data: message
      });
      
    } catch (error) {
      logger.error('Failed to fetch contact message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact message'
      });
    }
  });

  // Admin endpoint to update contact message status
  router.patch('/messages/:id',
    [
      body('status').optional().isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status'),
      body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
      body('adminNotes').optional().isString().isLength({ max: 1000 }).withMessage('Admin notes must be less than 1000 characters')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = {};
        
        if (req.body.status) {
          updateData.status = req.body.status;
          if (req.body.status === 'replied') {
            updateData.repliedAt = new Date();
          }
        }
        
        if (req.body.priority) {
          updateData.priority = req.body.priority;
        }
        
        if (req.body.adminNotes !== undefined) {
          updateData.adminNotes = req.body.adminNotes;
        }
        
        const updatedMessage = await readModelStore.updateById('ContactMessage', id, updateData);
        
        if (!updatedMessage) {
          return res.status(404).json({
            success: false,
            message: 'Contact message not found'
          });
        }
        
        logger.info('Contact message updated:', { id, updates: updateData });
        
        res.status(200).json({
          success: true,
          message: 'Contact message updated successfully',
          data: updatedMessage
        });
        
      } catch (error) {
        logger.error('Failed to update contact message:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update contact message'
        });
      }
    }
  );

  // Admin endpoint to delete contact message
  router.delete('/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedMessage = await readModelStore.deleteById('ContactMessage', id);
      
      if (!deletedMessage) {
        return res.status(404).json({
          success: false,
          message: 'Contact message not found'
        });
      }
      
      logger.info('Contact message deleted:', { id });
      
      res.status(200).json({
        success: true,
        message: 'Contact message deleted successfully'
      });
      
    } catch (error) {
      logger.error('Failed to delete contact message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete contact message'
      });
    }
  });

  return router;
};
