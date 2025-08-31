/**
 * SEO URL Utilities
 * 
 * This file contains utilities for:
 * - Generating SEO-friendly URLs
 * - Creating breadcrumb navigation
 * - URL validation and sanitization
 * - Slug generation
 * - Canonical URL management
 */

/**
 * Generate SEO-friendly slug from text
 * @param text - Text to convert to slug
 * @returns SEO-friendly slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate SEO-friendly course URL
 * @param courseTitle - Course title
 * @param courseId - Course ID (optional)
 * @returns SEO-friendly course URL
 */
export const generateCourseUrl = (courseTitle: string, courseId?: string): string => {
  const slug = generateSlug(courseTitle);
  return courseId ? `/courses/${slug}-${courseId}` : `/courses/${slug}`;
};

/**
 * Generate SEO-friendly blog post URL
 * @param postTitle - Blog post title
 * @param postId - Post ID (optional)
 * @returns SEO-friendly blog post URL
 */
export const generateBlogPostUrl = (postTitle: string, postId?: string): string => {
  const slug = generateSlug(postTitle);
  return postId ? `/blog/${slug}-${postId}` : `/blog/${slug}`;
};

/**
 * Generate SEO-friendly category URL
 * @param categoryName - Category name
 * @returns SEO-friendly category URL
 */
export const generateCategoryUrl = (categoryName: string): string => {
  const slug = generateSlug(categoryName);
  return `/category/${slug}`;
};

/**
 * Generate breadcrumb data for a page
 * @param pathname - Current pathname
 * @param pageTitle - Page title
 * @returns Breadcrumb array
 */
export const generateBreadcrumbs = (pathname: string, pageTitle?: string): Array<{ name: string; url: string }> => {
  const breadcrumbs = [
    { name: 'Home', url: '/' }
  ];

  const pathSegments = pathname.split('/').filter(segment => segment);

  pathSegments.forEach((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    let name = '';

    // Map URL segments to readable names
    switch (segment) {
      case 'courses':
        name = 'Courses';
        break;
      case 'blog':
        name = 'Blog';
        break;
      case 'about':
        name = 'About';
        break;
      case 'contact':
        name = 'Contact';
        break;
      case 'privacy':
        name = 'Privacy Policy';
        break;
      case 'terms':
        name = 'Terms of Service';
        break;
      case 'signin':
        name = 'Sign In';
        break;
      case 'signup':
        name = 'Sign Up';
        break;
      case 'dashboard':
        name = 'Dashboard';
        break;
      case 'profile':
        name = 'Profile';
        break;
      case 'subscription':
        name = 'Subscription';
        break;
      case 'admin':
        name = 'Admin';
        break;
      default:
        // For dynamic segments, try to extract meaningful name
        if (segment.includes('-')) {
          // Handle slugs like "digital-marketing-course-123"
          const parts = segment.split('-');
          const id = parts[parts.length - 1];
          if (/^\d+$/.test(id)) {
            // Remove ID and convert to title case
            name = parts.slice(0, -1)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          } else {
            name = segment.split('-')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          }
        } else {
          name = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
    }

    breadcrumbs.push({ name, url });
  });

  // Add page title if provided and different from last breadcrumb
  if (pageTitle && breadcrumbs[breadcrumbs.length - 1]?.name !== pageTitle) {
    breadcrumbs[breadcrumbs.length - 1] = { 
      name: pageTitle, 
      url: breadcrumbs[breadcrumbs.length - 1]?.url || pathname 
    };
  }

  return breadcrumbs;
};

/**
 * Validate if URL is SEO-friendly
 * @param url - URL to validate
 * @returns Validation result
 */
export const validateSeoUrl = (url: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check length
  if (url.length > 200) {
    issues.push('URL is too long (max 200 characters)');
  }

  // Check for special characters
  if (/[^a-zA-Z0-9\-_\/]/.test(url)) {
    issues.push('URL contains special characters');
  }

  // Check for multiple consecutive hyphens
  if (/--+/.test(url)) {
    issues.push('URL contains multiple consecutive hyphens');
  }

  // Check for trailing slash (except for root)
  if (url !== '/' && url.endsWith('/')) {
    issues.push('URL has trailing slash');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(url)) {
    issues.push('URL contains uppercase letters');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Generate canonical URL
 * @param pathname - Current pathname
 * @param baseUrl - Base URL (optional)
 * @returns Canonical URL
 */
export const generateCanonicalUrl = (pathname: string, baseUrl: string = 'https://thekingezekielacademy.com'): string => {
  // Remove trailing slash except for root
  const cleanPath = pathname === '/' ? pathname : pathname.replace(/\/$/, '');
  return `${baseUrl}${cleanPath}`;
};

/**
 * Extract course ID from URL
 * @param url - Course URL
 * @returns Course ID or null
 */
export const extractCourseIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/courses\/.*?-(\d+)$/);
  return match ? match[1] : null;
};

/**
 * Extract blog post ID from URL
 * @param url - Blog post URL
 * @returns Post ID or null
 */
export const extractBlogPostIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/blog\/.*?-(\d+)$/);
  return match ? match[1] : null;
};

/**
 * Generate sitemap URL for a page
 * @param pathname - Page pathname
 * @param lastmod - Last modified date
 * @param changefreq - Change frequency
 * @param priority - Priority (0.0 to 1.0)
 * @returns Sitemap URL object
 */
export const generateSitemapUrl = (
  pathname: string,
  lastmod: string = new Date().toISOString(),
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'weekly',
  priority: number = 0.5
) => {
  return {
    loc: `https://thekingezekielacademy.com${pathname}`,
    lastmod,
    changefreq,
    priority: Math.max(0, Math.min(1, priority)) // Ensure priority is between 0 and 1
  };
};

/**
 * Generate pagination URL
 * @param baseUrl - Base URL
 * @param page - Page number
 * @returns Pagination URL
 */
export const generatePaginationUrl = (baseUrl: string, page: number): string => {
  if (page === 1) {
    return baseUrl;
  }
  return `${baseUrl}/page/${page}`;
};

/**
 * Clean and normalize URL parameters
 * @param params - URL parameters object
 * @returns Cleaned parameters
 */
export const cleanUrlParams = (params: Record<string, any>): Record<string, string> => {
  const cleaned: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = String(value).trim();
    }
  });
  
  return cleaned;
};

/**
 * Generate search URL with parameters
 * @param query - Search query
 * @param filters - Search filters
 * @returns Search URL
 */
export const generateSearchUrl = (query: string, filters: Record<string, any> = {}): string => {
  const params = new URLSearchParams();
  
  if (query.trim()) {
    params.set('q', query.trim());
  }
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
};

/**
 * URL patterns for SEO-friendly routes
 */
export const SEO_URL_PATTERNS = {
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:slug',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  CATEGORY: '/category/:slug',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  SEARCH: '/search'
} as const;

/**
 * Check if URL matches SEO pattern
 * @param url - URL to check
 * @param pattern - Pattern to match against
 * @returns Match result
 */
export const matchSeoPattern = (url: string, pattern: string): boolean => {
  const patternRegex = pattern.replace(/:[^/]+/g, '[^/]+');
  return new RegExp(`^${patternRegex}$`).test(url);
};
