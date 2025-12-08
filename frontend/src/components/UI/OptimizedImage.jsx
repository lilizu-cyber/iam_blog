import { useState } from 'react';

/**
 * OptimizedImage component with lazy loading, responsive images, and WebP support
 * 
 * @param {Object} props
 * @param {string|Object} props.src - Image source URL or optimization object
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.size - Size to use (thumbnail, small, medium, large)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {string} props.sizes - Sizes attribute for responsive images
 * @param {string} props.aspectRatio - Aspect ratio (e.g., "16/9", "1/1")
 */
const OptimizedImage = ({
  src,
  alt,
  size = 'medium',
  className = '',
  lazy = true,
  sizes = '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw',
  aspectRatio,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle image source - can be a string URL or optimization object
  const getImageUrl = () => {
    if (typeof src === 'string') {
      return src;
    }

    if (src && src.optimization) {
      // Use optimized image if available
      const optimization = src.optimization;
      
      // Try WebP first, then fallback
      if (optimization.sizes && optimization.sizes[size]) {
        return optimization.sizes[size];
      }
      
      // Fallback to original
      if (src.url) {
        return src.url;
      }
    }

    if (src && src.url) {
      return src.url;
    }

    return null;
  };

  // Get srcset for responsive images
  const getSrcSet = () => {
    if (typeof src === 'string' || !src?.optimization) {
      return null;
    }

    const optimization = src.optimization;
    
    // Prefer WebP srcset
    if (optimization.srcset?.webp) {
      return optimization.srcset.webp;
    }
    
    // Fallback to other formats
    if (optimization.srcset?.jpg) {
      return optimization.srcset.jpg;
    }
    
    if (optimization.srcset?.png) {
      return optimization.srcset.png;
    }

    return null;
  };

  const imageUrl = getImageUrl();
  const srcSet = getSrcSet();

  if (!imageUrl) {
    return null;
  }

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
  };

  const imageProps = {
    alt,
    className: `${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    ...props,
  };

  // Add lazy loading
  if (lazy) {
    imageProps.loading = 'lazy';
  }

  // Add srcset for responsive images
  if (srcSet) {
    imageProps.srcSet = srcSet;
    imageProps.sizes = sizes;
  }

  // Add aspect ratio container if specified
  if (aspectRatio) {
    const [width, height] = aspectRatio.split('/').map(Number);
    const paddingBottom = `${(height / width) * 100}%`;

    return (
      <div className="relative overflow-hidden" style={{ paddingBottom }}>
        <img
          {...imageProps}
          src={imageUrl}
          className={`${imageProps.className} absolute inset-0 h-full w-full object-cover`}
        />
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <>
      <img {...imageProps} src={imageUrl} />
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </>
  );
};

export default OptimizedImage;


