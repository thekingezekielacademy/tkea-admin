/**
 * Canonical URL Utilities
 * 
 * Handles proper canonical URL generation for HashRouter and prevents
 * duplicate content issues with search engines.
 */

export interface CanonicalUrlOptions {
  path?: string;
  query?: Record<string, string>;
  hash?: string;
  baseUrl?: string;
}

// Base URL configuration
const BASE_URL = 'https://app.thekingezekielacademy.com';

/**
 * Generate canonical URL for HashRouter
 * Converts hash routes to clean canonical URLs
 */
export const generateCanonicalUrl = (options: CanonicalUrlOptions = {}): string => {
  const { path = '', query = {}, hash = '', baseUrl = BASE_URL } = options;
  
  // Clean the path - remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Build the URL
  let url = baseUrl;
  
  // Add path if provided
  if (cleanPath) {
    url += `/${cleanPath}`;
  }
  
  // Add query parameters if provided
  const queryParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.set(key, String(value));
    }
  });
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  // Note: We don't add hash to canonical URLs as they should be clean
  // Hash fragments are not part of canonical URLs
  
  return url;
};

/**
 * Convert HashRouter path to canonical path
 * Removes hash prefix and cleans the path
 */
export const hashPathToCanonical = (hashPath: string): string => {
  // Remove hash prefix if present
  let cleanPath = hashPath.startsWith('#/') ? hashPath.slice(2) : hashPath;
  cleanPath = cleanPath.startsWith('#') ? cleanPath.slice(1) : cleanPath;
  
  // Remove trailing slash
  cleanPath = cleanPath.endsWith('/') && cleanPath !== '/' ? cleanPath.slice(0, -1) : cleanPath;
  
  // Ensure it starts with /
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  return cleanPath;
};

/**
 * Get current page canonical URL from HashRouter
 */
export const getCurrentPageCanonical = (): string => {
  if (typeof window === 'undefined') {
    return BASE_URL;
  }
  
  // Get current hash path
  const currentHash = window.location.hash;
  const canonicalPath = hashPathToCanonical(currentHash);
  
  return generateCanonicalUrl({ path: canonicalPath });
};

/**
 * Generate canonical URL for specific page types
 */
export const getPageCanonical = (pageType: string, slug?: string, id?: string): string => {
  switch (pageType) {
    case 'home':
      return BASE_URL;
    
    case 'courses':
      return generateCanonicalUrl({ path: '/courses' });
    
    case 'course':
      if (!slug) throw new Error('Course slug is required');
      return generateCanonicalUrl({ path: `/course/${slug}` });
    
    case 'blog':
      return generateCanonicalUrl({ path: '/blog' });
    
    case 'blog-post':
      if (!slug) throw new Error('Blog post slug is required');
      return generateCanonicalUrl({ path: `/blog/${slug}` });
    
    case 'about':
      return generateCanonicalUrl({ path: '/about' });
    
    case 'contact':
      return generateCanonicalUrl({ path: '/contact' });
    
    case 'dashboard':
      return generateCanonicalUrl({ path: '/dashboard' });
    
    case 'profile':
      return generateCanonicalUrl({ path: '/profile' });
    
    case 'signin':
      return generateCanonicalUrl({ path: '/signin' });
    
    case 'signup':
      return generateCanonicalUrl({ path: '/signup' });
    
    case 'lesson':
      if (!id) throw new Error('Lesson ID is required');
      return generateCanonicalUrl({ path: `/lesson/${id}` });
    
    default:
      return BASE_URL;
  }
};

/**
 * Check if URL is canonical (no query params, no hash)
 */
export const isCanonicalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return !urlObj.search && !urlObj.hash;
  } catch {
    return false;
  }
};

/**
 * Normalize URL for comparison
 */
export const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

/**
 * Check if two URLs are duplicates
 */
export const areUrlsDuplicates = (url1: string, url2: string): boolean => {
  return normalizeUrl(url1) === normalizeUrl(url2);
};

/**
 * Get all possible URL variations for a page
 * Useful for identifying duplicate content sources
 */
export const getUrlVariations = (canonicalUrl: string): string[] => {
  const variations: string[] = [canonicalUrl];
  
  try {
    const url = new URL(canonicalUrl);
    
    // Add variations with different protocols
    if (url.protocol === 'https:') {
      variations.push(url.href.replace('https:', 'http:'));
    }
    
    // Add variations with trailing slash
    if (!url.pathname.endsWith('/') && url.pathname !== '/') {
      variations.push(url.href + '/');
    }
    
    // Add variations without trailing slash
    if (url.pathname.endsWith('/') && url.pathname !== '/') {
      variations.push(url.href.slice(0, -1));
    }
    
    // Add www variations
    if (!url.hostname.startsWith('www.')) {
      variations.push(url.href.replace(url.hostname, `www.${url.hostname}`));
    }
    
  } catch (error) {
    console.warn('Error generating URL variations:', error);
  }
  
  return Array.from(new Set(variations)); // Remove duplicates
};

/**
 * Generate robots.txt content to help with duplicate content
 */
export const generateRobotsTxt = (): string => {
  return `User-agent: *
Allow: /

# Disallow duplicate content paths
Disallow: /*?*
Disallow: /*#*
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Host
Host: ${BASE_URL}`;
};

export default {
  generateCanonicalUrl,
  hashPathToCanonical,
  getCurrentPageCanonical,
  getPageCanonical,
  isCanonicalUrl,
  normalizeUrl,
  areUrlsDuplicates,
  getUrlVariations,
  generateRobotsTxt
};
