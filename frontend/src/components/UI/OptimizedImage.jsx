import { useState } from 'react';
import { resolveUploadUrl } from '../../utils/apiUrl';

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
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getPrimaryUrl = () => {
    if (typeof src === 'string') {
      return src;
    }

    if (src?.url) {
      return src.url;
    }

    if (src?.optimization?.sizes?.[size]) {
      return src.optimization.sizes[size];
    }

    return null;
  };

  const getSrcSet = () => {
    if (useFallbackSrc || typeof src === 'string' || !src?.optimization?.srcset) {
      return null;
    }

    // When a direct url exists, prefer it over srcset to avoid broken legacy variants.
    if (src?.url) {
      return null;
    }

    const { srcset } = src.optimization;
    const raw = srcset?.webp || srcset?.jpg || srcset?.png;

    if (!raw) {
      return null;
    }

    return raw
      .split(',')
      .map((entry) => {
        const [url, descriptor] = entry.trim().split(/\s+/);
        const resolved = resolveUploadUrl(url);
        return descriptor ? `${resolved} ${descriptor}` : resolved;
      })
      .join(', ');
  };

  const imageUrl = getPrimaryUrl() ? resolveUploadUrl(getPrimaryUrl()) : null;
  const srcSet = getSrcSet();

  if (!imageUrl) {
    return null;
  }

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    if (!useFallbackSrc && typeof src === 'object' && src?.url) {
      setUseFallbackSrc(true);
      setIsLoaded(false);
      return;
    }

    setHasError(true);
    setIsLoaded(true);
  };

  const visibleClassName = `${className} ${
    isLoaded || hasError ? 'opacity-100' : 'opacity-0'
  } transition-opacity duration-300`;

  const imageProps = {
    alt,
    className: visibleClassName,
    onLoad: handleLoad,
    onError: handleError,
    ...props,
  };

  if (lazy) {
    imageProps.loading = 'lazy';
  }

  if (srcSet) {
    imageProps.srcSet = srcSet;
    imageProps.sizes = sizes;
  }

  if (aspectRatio) {
    const [width, height] = aspectRatio.split('/').map(Number);
    const paddingBottom = `${(height / width) * 100}%`;

    return (
      <div className="relative overflow-hidden" style={{ paddingBottom }}>
        <img
          {...imageProps}
          src={imageUrl}
          className={`${visibleClassName} absolute inset-0 h-full w-full object-cover`}
        />
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
        )}
      </div>
    );
  }

  return (
    <>
      <img {...imageProps} src={imageUrl} />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}
    </>
  );
};

export default OptimizedImage;
