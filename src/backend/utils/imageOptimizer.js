const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Lazy load Sharp - only load when needed
let sharp = null;
let sharpAvailable = false;

function loadSharp() {
  if (sharp !== null) {
    return sharpAvailable;
  }
  
  try {
    sharp = require('sharp');
    sharpAvailable = true;
    logger.debug('Sharp module loaded successfully');
    return true;
  } catch (error) {
    sharpAvailable = false;
    logger.warn('Sharp module not available - image optimization will be disabled:', error.message);
    return false;
  }
}

// Image size presets
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  small: { width: 640, height: 360 },
  medium: { width: 1280, height: 720 },
  large: { width: 1920, height: 1080 },
};

// Quality settings
const QUALITY = {
  webp: 85,
  jpeg: 90,
  png: 90,
};

function toPublicUploadPath(uploadPath) {
  if (!uploadPath || typeof uploadPath !== 'string') {
    return uploadPath;
  }

  if (uploadPath.startsWith('/uploads/')) {
    return uploadPath.replace(
      /^\/uploads\/images\/(?!optimized\/)([^/]+)\/(.+)$/,
      '/uploads/images/optimized/$1/$2'
    );
  }

  const uploadsRoot = `${path.sep}uploads${path.sep}`;
  const uploadsIndex = uploadPath.indexOf(uploadsRoot);
  if (uploadsIndex === -1) {
    return uploadPath;
  }

  const relativePath = uploadPath
    .slice(uploadsIndex)
    .split(path.sep)
    .join('/');

  return toPublicUploadPath(relativePath);
}

/**
 * Optimize and resize an image, generating multiple sizes and formats
 * @param {string} inputPath - Path to the original image
 * @param {string} outputDir - Directory to save optimized images
 * @param {string} baseFilename - Base filename (without extension)
 * @returns {Promise<Object>} Object containing paths and metadata for all generated images
 */
async function optimizeImage(inputPath, outputDir, baseFilename) {
  try {
    // Check if Sharp is available
    if (!loadSharp() || !sharp) {
      logger.warn('Image optimization skipped - Sharp module not available');
      // Return original image info without optimization
      const stats = fs.statSync(inputPath);
      return {
        original: {
          path: inputPath,
          format: path.extname(inputPath).slice(1).toLowerCase() || 'unknown',
          size: stats.size,
        },
        optimized: false,
        error: 'Sharp module not available'
      };
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const originalFormat = metadata.format;
    const isAnimated = metadata.pages > 1; // GIF with multiple frames

    // If animated GIF, skip optimization (preserve animation)
    if (isAnimated && originalFormat === 'gif') {
      logger.info(`Skipping optimization for animated GIF: ${baseFilename}`);
      return {
        original: {
          path: inputPath,
          format: 'gif',
          width: metadata.width,
          height: metadata.height,
          size: fs.statSync(inputPath).size,
        },
        optimized: false,
      };
    }

    const results = {
      original: {
        path: inputPath,
        format: originalFormat,
        width: metadata.width,
        height: metadata.height,
        size: fs.statSync(inputPath).size,
      },
      sizes: {},
      formats: {},
    };

    // Generate WebP versions for all sizes
    const webpSizes = {};
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      const outputPath = path.join(outputDir, `${baseFilename}-${sizeName}.webp`);
      
      await sharp(inputPath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY.webp })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      webpSizes[sizeName] = {
        path: outputPath,
        url: `/uploads/images/optimized/${baseFilename}/${path.basename(outputPath)}`,
        format: 'webp',
        width: dimensions.width,
        height: dimensions.height,
        size: stats.size,
      };

      logger.debug(`Generated WebP ${sizeName}: ${path.basename(outputPath)} (${(stats.size / 1024).toFixed(2)}KB)`);
    }

    results.formats.webp = webpSizes;

    // Generate original format versions (JPEG/PNG) for fallback
    if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
      const jpegSizes = {};
      for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
        const outputPath = path.join(outputDir, `${baseFilename}-${sizeName}.jpg`);
        
        await sharp(inputPath)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: QUALITY.jpeg, mozjpeg: true })
          .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        jpegSizes[sizeName] = {
          path: outputPath,
          url: `/uploads/images/optimized/${baseFilename}/${path.basename(outputPath)}`,
          format: 'jpg',
          width: dimensions.width,
          height: dimensions.height,
          size: stats.size,
        };
      }
      results.formats.jpg = jpegSizes;
    } else if (originalFormat === 'png') {
      const pngSizes = {};
      for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
        const outputPath = path.join(outputDir, `${baseFilename}-${sizeName}.png`);
        
        await sharp(inputPath)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png({ quality: QUALITY.png, compressionLevel: 9 })
          .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        pngSizes[sizeName] = {
          path: outputPath,
          url: `/uploads/images/optimized/${baseFilename}/${path.basename(outputPath)}`,
          format: 'png',
          width: dimensions.width,
          height: dimensions.height,
          size: stats.size,
        };
      }
      results.formats.png = pngSizes;
    }

    // Calculate total size reduction
    const originalSize = results.original.size;
    const optimizedSize = Object.values(results.formats.webp).reduce(
      (sum, size) => sum + size.size,
      0
    );
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    logger.info(`Image optimized: ${baseFilename} - ${reduction}% size reduction`);

    return results;
  } catch (error) {
    logger.error(`Error optimizing image ${inputPath}:`, error);
    throw error;
  }
}

/**
 * Get the best image URL for a given size and format preference
 * @param {Object} imageData - Image data object from optimizeImage
 * @param {string} size - Size name (thumbnail, small, medium, large)
 * @param {string} preferredFormat - Preferred format (webp, jpg, png)
 * @returns {string|null} URL to the best matching image
 */
function getImageUrl(imageData, size = 'medium', preferredFormat = 'webp') {
  if (!imageData || !imageData.formats) {
    return null;
  }

  // If animated GIF or Sharp unavailable, return the web path (not a filesystem path)
  if (imageData.optimized === false) {
    if (imageData.original?.url) {
      return toPublicUploadPath(imageData.original.url);
    }
    return toPublicUploadPath(imageData.original?.path);
  }

  // Try preferred format first, then fallback
  const formats = [preferredFormat, 'webp', 'jpg', 'png'];
  
  for (const format of formats) {
    if (imageData.formats[format] && imageData.formats[format][size]) {
      return toPublicUploadPath(imageData.formats[format][size].url);
    }
  }

  // Fallback to original upload in /uploads/images/<filename>
  return toPublicUploadPath(imageData.original?.path);
}

/**
 * Generate srcset for responsive images
 * @param {Object} imageData - Image data object from optimizeImage
 * @param {string} format - Format to use (webp, jpg, png)
 * @returns {string} srcset string for <img srcset>
 */
function generateSrcSet(imageData, format = 'webp') {
  if (!imageData || !imageData.formats || !imageData.formats[format]) {
    return '';
  }

  const sizes = imageData.formats[format];
  const srcsetParts = [];

  if (sizes.thumbnail) {
    srcsetParts.push(`${toPublicUploadPath(sizes.thumbnail.url)} ${sizes.thumbnail.width}w`);
  }
  if (sizes.small) {
    srcsetParts.push(`${toPublicUploadPath(sizes.small.url)} ${sizes.small.width}w`);
  }
  if (sizes.medium) {
    srcsetParts.push(`${toPublicUploadPath(sizes.medium.url)} ${sizes.medium.width}w`);
  }
  if (sizes.large) {
    srcsetParts.push(`${toPublicUploadPath(sizes.large.url)} ${sizes.large.width}w`);
  }

  return srcsetParts.join(', ');
}

/**
 * Get sizes attribute for responsive images
 * @returns {string} sizes attribute for <img sizes>
 */
function getSizesAttribute() {
  return '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw';
}

module.exports = {
  optimizeImage,
  getImageUrl,
  generateSrcSet,
  getSizesAttribute,
  IMAGE_SIZES,
  QUALITY,
};

