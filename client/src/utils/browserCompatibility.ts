/**
 * Browser Compatibility Utility
 * 
 * Detects older browsers and in-app browsers to provide
 * simplified SEO and compatibility features
 */

export interface BrowserInfo {
  isOldBrowser: boolean;
  isInAppBrowser: boolean;
  isOldSafari: boolean;
  isOldChrome: boolean;
  isInstagram: boolean;
  isFacebook: boolean;
  supportsModernFeatures: boolean;
  userAgent: string;
}

/**
 * Detect if the current browser is an older version that needs simplified SEO
 */
export const isOldBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent;
  
  // Old Safari (before 13)
  const isOldSafari = /Safari\/[0-9]/.test(ua) && 
                     !/Chrome/.test(ua) && 
                     !/Version\/1[3-9]/.test(ua);
  
  // Old Chrome (before 60)
  const isOldChrome = /Chrome\/[0-5][0-9]/.test(ua);
  
  // Old Firefox (before 60)
  const isOldFirefox = /Firefox\/[0-5][0-9]/.test(ua);
  
  // Old Edge (before 79)
  const isOldEdge = /Edge\/[0-7][0-9]/.test(ua);
  
  return isOldSafari || isOldChrome || isOldFirefox || isOldEdge;
};

/**
 * Detect if the current browser is an in-app browser
 */
export const isInAppBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  
  return /instagram|fbav|fban|fbsv|fbios|line|whatsapp|telegram|wv\)/i.test(ua);
};

/**
 * Detect specific browser types
 */
export const isInstagram = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /instagram/i.test(navigator.userAgent);
};

export const isFacebook = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /fbav|fban|fbsv|fbios/i.test(navigator.userAgent);
};

export const isOldSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari\/[0-9]/.test(ua) && 
         !/Chrome/.test(ua) && 
         !/Version\/1[3-9]/.test(ua);
};

export const isOldChrome = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Chrome\/[0-5][0-9]/.test(navigator.userAgent);
};

/**
 * Check if browser supports modern features needed for complex SEO
 */
export const supportsModernFeatures = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for modern features
  const hasIntersectionObserver = 'IntersectionObserver' in window;
  const hasResizeObserver = 'ResizeObserver' in window;
  const hasCustomElements = 'customElements' in window;
  const hasFetch = 'fetch' in window;
  const hasPromise = 'Promise' in window;
  
  return hasIntersectionObserver && 
         hasResizeObserver && 
         hasCustomElements && 
         hasFetch && 
         hasPromise;
};

/**
 * Get comprehensive browser information
 */
export const getBrowserInfo = (): BrowserInfo => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  return {
    isOldBrowser: isOldBrowser(),
    isInAppBrowser: isInAppBrowser(),
    isOldSafari: isOldSafari(),
    isOldChrome: isOldChrome(),
    isInstagram: isInstagram(),
    isFacebook: isFacebook(),
    supportsModernFeatures: supportsModernFeatures(),
    userAgent
  };
};

/**
 * Determine if we should use simplified SEO for compatibility
 */
export const shouldUseSimplifiedSEO = (): boolean => {
  const browserInfo = getBrowserInfo();
  
  // Use simplified SEO for:
  // 1. Old browsers
  // 2. In-app browsers (Instagram, Facebook, etc.)
  // 3. Browsers that don't support modern features
  
  return browserInfo.isOldBrowser || 
         browserInfo.isInAppBrowser || 
         !browserInfo.supportsModernFeatures;
};

/**
 * Get simplified viewport meta tag for older browsers
 */
export const getSimplifiedViewport = (): string => {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isInAppBrowser) {
    // For in-app browsers, use a more compatible viewport
    return 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
  
  if (browserInfo.isOldBrowser) {
    // For old browsers, use basic viewport
    return 'width=device-width, initial-scale=1.0';
  }
  
  // For modern browsers, use full viewport
  return 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
};

/**
 * Check if we should disable certain SEO features for compatibility
 */
export const getSEOCompatibilityConfig = () => {
  const browserInfo = getBrowserInfo();
  
  return {
    // Disable complex structured data for old browsers
    enableStructuredData: !browserInfo.isOldBrowser && browserInfo.supportsModernFeatures,
    
    // Disable preconnect for old browsers
    enablePreconnect: !browserInfo.isOldBrowser,
    
    // Use simplified meta tags for in-app browsers
    useSimplifiedMeta: browserInfo.isInAppBrowser || browserInfo.isOldBrowser,
    
    // Disable analytics for in-app browsers
    enableAnalytics: !browserInfo.isInAppBrowser,
    
    // Use basic viewport for compatibility
    viewport: getSimplifiedViewport()
  };
};

export default {
  isOldBrowser,
  isInAppBrowser,
  isInstagram,
  isFacebook,
  isOldSafari,
  isOldChrome,
  supportsModernFeatures,
  getBrowserInfo,
  shouldUseSimplifiedSEO,
  getSimplifiedViewport,
  getSEOCompatibilityConfig
};
