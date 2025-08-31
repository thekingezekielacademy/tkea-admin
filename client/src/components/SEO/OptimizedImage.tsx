import React, { useState, useRef, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholderSrc?: string;
  effect?: 'blur' | 'opacity' | 'black-and-white';
  threshold?: number;
  wrapperClassName?: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage Component - SEO and Performance Optimized Images
 * 
 * Features:
 * - Lazy loading for better performance
 * - Proper alt text for accessibility and SEO
 * - Responsive images with srcSet support
 * - Placeholder images while loading
 * - Error handling
 * - Click handlers for interactive images
 * - Customizable loading effects
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholderSrc = '/img/placeholder.jpg',
  effect = 'blur',
  threshold = 0.1,
  wrapperClassName = '',
  onClick,
  loading = 'lazy',
  sizes,
  srcSet,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Generate responsive srcSet if not provided
  const generateSrcSet = () => {
    if (srcSet) return srcSet;
    
    // Default responsive breakpoints
    const breakpoints = [320, 480, 768, 1024, 1200];
    return breakpoints
      .map(bp => `${src}?w=${bp} ${bp}w`)
      .join(', ');
  };

  // Generate sizes attribute if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    
    // Default responsive sizes
    return '(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 768px) 720px, (max-width: 1024px) 960px, 1200px';
  };

  // If image failed to load, show placeholder
  if (imageError) {
    return (
      <img
        src={placeholderSrc}
        alt={`${alt} - Image not available`}
        className={`${className} opacity-50`}
        width={width}
        height={height}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    );
  }

  // For eager loading (above the fold), use regular img
  if (loading === 'eager') {
    return (
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        sizes={generateSizes()}
        srcSet={generateSrcSet()}
      />
    );
  }

  // For lazy loading, use LazyLoadImage
  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      effect={effect}
      threshold={threshold}
      wrapperClassName={wrapperClassName}
      placeholderSrc={placeholderSrc}
      onClick={onClick}
      onLoad={handleImageLoad}
      onError={handleImageError}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      sizes={generateSizes()}
      srcSet={generateSrcSet()}
    />
  );
};

export default OptimizedImage;
