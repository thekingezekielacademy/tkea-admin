/**
 * SEO Components Index
 * 
 * This file exports all SEO-related components for easy importing
 */

// Core SEO Components
export { default as SEOHead } from './SEOHead';
export { default as OptimizedImage } from './OptimizedImage';

// Dashboard Components
export { default as SEODashboard } from './SEODashboard';
export { default as SEOAnalytics } from './SEOAnalytics';
export { default as PerformanceDashboard } from './PerformanceDashboard';

// Navigation Components
export { default as Breadcrumbs, BreadcrumbPageWrapper } from './Breadcrumbs';

// Structured Data
export * from './StructuredData';

// Re-export types for convenience
export type { SEOHeadProps } from './SEOHead';
export type { OptimizedImageProps } from './OptimizedImage';
