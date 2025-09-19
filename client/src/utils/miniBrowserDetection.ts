/**
 * Mini Browser Detection Utilities
 * 
 * Enhanced detection for Instagram/Facebook mini browsers and other in-app browsers
 * that require client-only rendering to avoid SSR hydration issues.
 */

/**
 * Detect if the current browser is a mini browser (Instagram, Facebook, etc.)
 * that should use client-only rendering instead of SSR hydration
 */
export const isMiniBrowser = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  const vendor = (navigator as any).vendor || '';
  const opera = (window as any).opera || '';
  
  // Combine all user agent strings for comprehensive detection
  const fullUA = `${userAgent} ${vendor} ${opera}`.toLowerCase();
  
  // Instagram mini browser detection
  const isInstagram = /instagram/i.test(fullUA);
  
  // Facebook mini browser detection
  const isFacebook = /fban|fbav|fbios|fbsv/i.test(fullUA);
  
  // Other problematic in-app browsers
  const isOtherMiniBrowser = /line|twitter|linkedin|whatsapp|telegram|wechat|snapchat/i.test(fullUA);
  
  // iOS WebView detection (common in mini browsers)
  const isIOSWebView = /iphone|ipad|ipod/i.test(fullUA) && /version\/[\d.]+.*safari/i.test(fullUA) && !/chrome|crios|fxios/i.test(fullUA);
  
  // Android WebView detection
  const isAndroidWebView = /android/i.test(fullUA) && /version\/[\d.]+.*chrome\/[\d.]+.*mobile.*safari/i.test(fullUA);
  
  return isInstagram || isFacebook || isOtherMiniBrowser || isIOSWebView || isAndroidWebView;
};

/**
 * Detect specific mini browser types for more targeted handling
 */
export const getMiniBrowserType = (): string | null => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/instagram/i.test(userAgent)) return 'instagram';
  if (/fban|fbav|fbios|fbsv/i.test(userAgent)) return 'facebook';
  if (/line/i.test(userAgent)) return 'line';
  if (/twitter/i.test(userAgent)) return 'twitter';
  if (/linkedin/i.test(userAgent)) return 'linkedin';
  if (/whatsapp/i.test(userAgent)) return 'whatsapp';
  if (/telegram/i.test(userAgent)) return 'telegram';
  if (/wechat/i.test(userAgent)) return 'wechat';
  if (/snapchat/i.test(userAgent)) return 'snapchat';
  
  return null;
};

/**
 * Check if the browser supports modern React features (hydration, concurrent features)
 */
export const supportsModernReact = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Mini browsers often have limited JavaScript engine support
  if (isMiniBrowser()) return false;
  
  // Check for modern JavaScript features that React 18 relies on
  try {
    // Check for Promise.allSettled (ES2020)
    if (!Promise.allSettled) return false;
    
    // Check for BigInt (ES2020)
    if (typeof BigInt === 'undefined') return false;
    
    // Check for optional chaining (ES2020)
    const testObj = { test: { value: 1 } };
    if (testObj?.test?.value !== 1) return false;
    
    // Check for nullish coalescing (ES2020)
    const test = null ?? 'default';
    if (test !== 'default') return false;
    
    // Check for globalThis (ES2020)
    if (typeof globalThis === 'undefined') return false;
    
    // Check for dynamic imports (available in modern environments)
    // Note: import() is always available in ES2020+ environments
    
    return true;
  } catch (error) {
    console.warn('Modern React feature check failed:', error);
    return false;
  }
};

/**
 * Get comprehensive browser information for debugging and optimization
 */
export const getBrowserInfo = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMiniBrowser: false,
      miniBrowserType: null,
      supportsModernReact: false,
      userAgent: '',
      vendor: '',
      platform: '',
      language: '',
      cookieEnabled: false,
      onLine: false
    };
  }

  const miniBrowserType = getMiniBrowserType();
  
  return {
    isMiniBrowser: isMiniBrowser(),
    miniBrowserType,
    supportsModernReact: supportsModernReact(),
    userAgent: navigator.userAgent,
    vendor: (navigator as any).vendor || '',
    platform: navigator.platform || '',
    language: navigator.language || '',
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    // Additional capabilities
    supportsServiceWorker: 'serviceWorker' in navigator && !isMiniBrowser(),
    supportsLocalStorage: (() => {
      try {
        return 'localStorage' in window && window.localStorage !== null;
      } catch {
        return false;
      }
    })(),
    supportsSessionStorage: (() => {
      try {
        return 'sessionStorage' in window && window.sessionStorage !== null;
      } catch {
        return false;
      }
    })(),
    supportsIndexedDB: (() => {
      try {
        return 'indexedDB' in window && window.indexedDB !== null;
      } catch {
        return false;
      }
    })()
  };
};

/**
 * Log browser information for debugging
 */
export const logBrowserInfo = (): void => {
  const info = getBrowserInfo();
  
  console.log('🔍 Browser Detection Results:', {
    isMiniBrowser: info.isMiniBrowser,
    miniBrowserType: info.miniBrowserType,
    supportsModernReact: info.supportsModernReact,
    userAgent: info.userAgent,
    platform: info.platform,
    language: info.language,
    capabilities: {
      serviceWorker: info.supportsServiceWorker,
      localStorage: info.supportsLocalStorage,
      sessionStorage: info.supportsSessionStorage,
      indexedDB: info.supportsIndexedDB
    }
  });
  
  // Store in window for global access
  if (typeof window !== 'undefined') {
    (window as any).__KEA_BROWSER_INFO__ = info;
  }
};

/**
 * Check if we should force client-only rendering
 * This is the main decision function for the app bootstrap
 */
export const shouldUseClientOnlyRender = (): boolean => {
  return isMiniBrowser() || !supportsModernReact();
};

/**
 * Get rendering strategy recommendation
 */
export const getRenderingStrategy = (): 'client-only' | 'ssr-hydration' | 'modern-hydration' => {
  if (shouldUseClientOnlyRender()) {
    return 'client-only';
  }
  
  // Check if SSR markup exists
  if (typeof document !== 'undefined') {
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.children.length > 0) {
      return 'ssr-hydration';
    }
  }
  
  return 'modern-hydration';
};
