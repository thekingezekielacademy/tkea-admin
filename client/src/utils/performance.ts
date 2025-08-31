/**
 * Performance Optimization Utilities
 * 
 * This file contains utilities for:
 * - Code splitting and lazy loading
 * - Performance monitoring
 * - Image optimization
 * - Caching strategies
 * - Bundle analysis
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy load components with loading fallback
 * @param importFunc - Dynamic import function
 * @param fallback - Loading fallback component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return lazy(importFunc);
}

/**
 * Preload critical components for better performance
 * @param importFunc - Dynamic import function
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return () => {
    importFunc();
    return null;
  };
}

/**
 * Intersection Observer for lazy loading
 * @param callback - Function to call when element is visible
 * @param options - Intersection Observer options
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }
  return null;
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance
   * @param name - Metric name
   */
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring performance
   * @param name - Metric name
   */
  endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      const duration = measure.duration;
      
      this.metrics.set(name, duration);
      
      // Clean up marks and measures
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return duration;
    }
    return 0;
  }

  /**
   * Get performance metric
   * @param name - Metric name
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate responsive image srcSet
   * @param src - Base image source
   * @param widths - Array of widths
   */
  static generateSrcSet(src: string, widths: number[]): string {
    return widths
      .map(width => `${src}?w=${width} ${width}w`)
      .join(', ');
  }

  /**
   * Generate responsive image sizes
   * @param breakpoints - Array of breakpoint objects
   */
  static generateSizes(breakpoints: Array<{ maxWidth: number; width: string }>): string {
    return breakpoints
      .map(bp => `(max-width: ${bp.maxWidth}px) ${bp.width}`)
      .join(', ');
  }

  /**
   * Check if image is in viewport
   * @param element - Image element
   */
  static isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

/**
 * Bundle analysis utilities
 */
export class BundleAnalyzer {
  /**
   * Get bundle size information
   */
  static getBundleInfo(): { size: number; gzippedSize: number } {
    // This would typically integrate with webpack-bundle-analyzer
    // For now, return mock data
    return {
      size: 1024 * 1024, // 1MB
      gzippedSize: 256 * 1024 // 256KB
    };
  }

  /**
   * Analyze chunk sizes
   */
  static getChunkSizes(): Record<string, number> {
    // This would analyze webpack chunks
    return {
      main: 512 * 1024,
      vendor: 256 * 1024,
      runtime: 64 * 1024
    };
  }
}

/**
 * Caching utilities
 */
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Set cache item
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   */
  static set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache item
   * @param key - Cache key
   */
  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Clear expired cache items
   */
  static clearExpired(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const cacheManager = CacheManager;
export const imageOptimizer = ImageOptimizer;
export const bundleAnalyzer = BundleAnalyzer;
