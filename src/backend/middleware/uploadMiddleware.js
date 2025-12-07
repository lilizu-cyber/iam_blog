const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { optimizeImage } = require('../utils/imageOptimizer');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const pdfsDir = path.join(uploadsDir, 'pdfs');
const optimizedImagesDir = path.join(imagesDir, 'optimized');

[uploadsDir, imagesDir, pdfsDir, optimizedImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, imagesDir);
    } else if (file.mimetype === 'application/pdf') {
      cb(null, pdfsDir);
    } else {
      cb(new Error('Unsupported file type'), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf'
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  documents: ['.pdf']
};

// File filter with strict validation
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    logger.warn('File upload rejected - invalid MIME type:', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      ip: req.ip
    });
    return cb(new Error('Only images (JPEG, PNG, GIF, WebP, SVG) and PDF files are allowed'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);

  if (isImage && !ALLOWED_EXTENSIONS.images.includes(ext)) {
    logger.warn('File upload rejected - extension mismatch for image:', {
      mimetype: file.mimetype,
      extension: ext,
      originalname: file.originalname
    });
    return cb(new Error('File extension does not match image type'), false);
  }

  if (isDocument && !ALLOWED_EXTENSIONS.documents.includes(ext)) {
    logger.warn('File upload rejected - extension mismatch for document:', {
      mimetype: file.mimetype,
      extension: ext,
      originalname: file.originalname
    });
    return cb(new Error('File extension does not match document type'), false);
  }

  // Check for suspicious file names (path traversal, null bytes, etc.)
  if (file.originalname.includes('..') || 
      file.originalname.includes('\0') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')) {
    logger.warn('File upload rejected - suspicious filename:', {
      originalname: file.originalname,
      ip: req.ip
    });
    return cb(new Error('Invalid filename'), false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple file uploads
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for multiple fields
const uploadFields = (fields) => {
  return upload.fields(fields);
};

/**
 * Middleware to process and optimize uploaded images
 * This should be called after multer upload middleware
 */
const processImageUpload = async (req, res, next) => {
  // Only process if files were uploaded
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const imageOptimizationEnabled = process.env.IMAGE_OPTIMIZATION_ENABLED !== 'false';
  
  if (!imageOptimizationEnabled) {
    logger.info('Image optimization is disabled');
    return next();
  }

  try {
    const processedFiles = [];

    for (const file of req.files) {
      // Only process image files
      if (!file.mimetype.startsWith('image/')) {
        processedFiles.push({
          ...file,
          optimized: false,
        });
        continue;
      }

      try {
        // Get base filename without extension
        const ext = path.extname(file.filename);
        const baseFilename = path.basename(file.filename, ext);
        const optimizedDir = path.join(optimizedImagesDir, baseFilename);

        // Optimize image
        const optimizationResult = await optimizeImage(
          file.path,
          optimizedDir,
          baseFilename
        );

        // Add optimization metadata to file object
        file.optimization = optimizationResult;
        file.optimized = optimizationResult.optimized !== false;

        processedFiles.push(file);
      } catch (error) {
        logger.error(`Failed to optimize image ${file.filename}:`, error);
        // Continue with original file if optimization fails
        file.optimized = false;
        processedFiles.push(file);
      }
    }

    // Replace req.files with processed files
    req.files = processedFiles;
    next();
  } catch (error) {
    logger.error('Error processing image uploads:', error);
    // Continue with original files if processing fails
    next();
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  upload,
  processImageUpload,
  optimizedImagesDir,
};




