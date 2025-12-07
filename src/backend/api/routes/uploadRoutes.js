const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { uploadMultiple, processImageUpload } = require('../../middleware/uploadMiddleware');
const { authenticateAdmin } = require('../../middleware/authMiddleware');
const { getImageUrl, generateSrcSet } = require('../../utils/imageOptimizer');
const logger = require('../../utils/logger');

module.exports = () => {
  // Upload files (images and PDFs)
  router.post('/files',
    authenticateAdmin,
    uploadMultiple('files', 10),
    processImageUpload,
    async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        const uploadedFiles = req.files.map(file => {
          // Determine file type
          const isImage = file.mimetype.startsWith('image/');
          const isPDF = file.mimetype === 'application/pdf';
          
          // Get relative path for serving
          const relativePath = isImage 
            ? `/uploads/images/${file.filename}`
            : `/uploads/pdfs/${file.filename}`;

          const fileData = {
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: relativePath,
            type: isImage ? 'image' : isPDF ? 'pdf' : 'unknown',
            uploadedAt: new Date().toISOString()
          };

          // Add optimization data if available
          if (isImage && file.optimization) {
            fileData.optimized = file.optimized || false;
            fileData.optimization = {
              original: file.optimization.original,
              formats: Object.keys(file.optimization.formats || {}),
              sizes: {
                thumbnail: getImageUrl(file.optimization, 'thumbnail', 'webp'),
                small: getImageUrl(file.optimization, 'small', 'webp'),
                medium: getImageUrl(file.optimization, 'medium', 'webp'),
                large: getImageUrl(file.optimization, 'large', 'webp'),
              },
              srcset: {
                webp: generateSrcSet(file.optimization, 'webp'),
                jpg: generateSrcSet(file.optimization, 'jpg'),
                png: generateSrcSet(file.optimization, 'png'),
              }
            };
          }

          return fileData;
        });

        logger.info(`Uploaded ${uploadedFiles.length} file(s) by user ${req.user.id}`);

        res.status(200).json({
          success: true,
          message: 'Files uploaded successfully',
          data: {
            files: uploadedFiles,
            count: uploadedFiles.length
          }
        });

      } catch (error) {
        logger.error('File upload error:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload files'
        });
      }
    }
  );

  // Delete uploaded file
  router.delete('/files/:filename',
    authenticateAdmin,
    async (req, res) => {
      try {
        const { filename } = req.params;
        
        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid filename'
          });
        }

        // Try to find and delete the file
        const imagesPath = path.join(process.cwd(), 'uploads', 'images', filename);
        const pdfsPath = path.join(process.cwd(), 'uploads', 'pdfs', filename);

        let deleted = false;
        if (fs.existsSync(imagesPath)) {
          fs.unlinkSync(imagesPath);
          deleted = true;
        } else if (fs.existsSync(pdfsPath)) {
          fs.unlinkSync(pdfsPath);
          deleted = true;
        }

        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: 'File not found'
          });
        }

        logger.info(`Deleted file ${filename} by user ${req.user.id}`);

        res.status(200).json({
          success: true,
          message: 'File deleted successfully'
        });

      } catch (error) {
        logger.error('File delete error:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to delete file'
        });
      }
    }
  );

  // Serve uploaded files
  router.get('/files/:type/:filename', (req, res) => {
    try {
      const { type, filename } = req.params;
      
      // Security: prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).send('Invalid filename');
      }

      if (type !== 'images' && type !== 'pdfs') {
        return res.status(400).send('Invalid file type');
      }

      const filePath = path.join(process.cwd(), 'uploads', type, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }

      res.sendFile(filePath);

    } catch (error) {
      logger.error('File serve error:', error);
      res.status(500).send('Error serving file');
    }
  });

  return router;
};
