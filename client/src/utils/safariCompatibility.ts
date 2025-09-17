/**
 * Safari Compatibility Utilities
 * 
 * This file contains utilities to handle Safari-specific issues
 * and provide fallbacks for older Safari versions.
 */

// Detect Safari version
export const getSafariVersion = (): number | null => {
  const userAgent = navigator.userAgent;
  const safariMatch = userAgent.match(/Version\/(\d+)/);
  return safariMatch ? parseInt(safariMatch[1], 10) : null;
};

// Check if running on Safari
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Check if running on iOS Safari
export const isIOSSafari = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Check if running in Instagram in-app browser
export const isInstagramBrowser = (): boolean => {
  return /Instagram/i.test(navigator.userAgent);
};

// Check if running in Facebook in-app browser
export const isFacebookBrowser = (): boolean => {
  return /FBAN|FBAV|FBIOS/i.test(navigator.userAgent);
};

// Check if running in any in-app browser (Instagram, Facebook, etc.)
export const isInAppBrowser = (): boolean => {
  return isInstagramBrowser() || isFacebookBrowser() || 
         /Line|Twitter|LinkedIn|WhatsApp|Telegram/i.test(navigator.userAgent);
};

// Check if running on Safari WebKit (includes in-app browsers)
export const isSafariWebKit = (): boolean => {
  return isSafari() || isInAppBrowser() || /WebKit/i.test(navigator.userAgent);
};

// Check if running on old Safari (version < 14)
export const isOldSafari = (): boolean => {
  const version = getSafariVersion();
  return isSafari() && version !== null && version < 14;
};

// Get browser capabilities
export const getBrowserCapabilities = () => {
  const safariVersion = getSafariVersion();
  const isSafariBrowser = isSafari();
  const isInApp = isInAppBrowser();
  const isWebKit = isSafariWebKit();
  
  // In-app browsers often have limited capabilities
  const isLimitedEnvironment = isInApp || (isWebKit && safariVersion && safariVersion < 14);
  
  return {
    isSafari: isSafariBrowser,
    isIOSSafari: isIOSSafari(),
    isInstagramBrowser: isInstagramBrowser(),
    isFacebookBrowser: isFacebookBrowser(),
    isInAppBrowser: isInApp,
    isSafariWebKit: isWebKit,
    isLimitedEnvironment,
    version: safariVersion,
    isOldSafari: isOldSafari(),
    supportsOptionalChaining: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 14),
    supportsNullishCoalescing: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 14),
    supportsObjectFromEntries: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 14),
    supportsStringReplaceAll: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 13),
    supportsPromiseFinally: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 12),
    supportsRegexLookbehind: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 16),
    supportsURLPattern: !isLimitedEnvironment && (safariVersion === null || safariVersion >= 15)
  };
};

// Safari-specific polyfills and fixes
export const applySafariFixes = (): void => {
  const safariVersion = getSafariVersion();
  const isSafariBrowser = isSafari();
  const isInApp = isInAppBrowser();
  const isWebKit = isSafariWebKit();
  
  console.log('🔍 Safari/WebKit Detection:', {
    isSafari: isSafariBrowser,
    isIOSSafari: isIOSSafari(),
    isInstagramBrowser: isInstagramBrowser(),
    isFacebookBrowser: isFacebookBrowser(),
    isInAppBrowser: isInApp,
    isSafariWebKit: isWebKit,
    version: safariVersion,
    userAgent: navigator.userAgent
  });

  if (!isWebKit) return;

  // Fix for Safari < 14 - Object.fromEntries polyfill
  if (safariVersion && safariVersion < 14) {
    if (!Object.fromEntries) {
      Object.fromEntries = function(entries: any) {
        const result: any = {};
        for (const [key, value] of entries) {
          result[key] = value;
        }
        return result;
      };
    }
  }

  // Fix for Safari < 13 - String.replaceAll polyfill
  if (safariVersion && safariVersion < 13) {
    if (!String.prototype.replaceAll) {
      String.prototype.replaceAll = function(search: string | RegExp, replace: string | Function): string {
        return this.split(search).join(replace as string);
      };
    }
  }

  // Fix for Safari < 12 - Promise.finally polyfill
  if (safariVersion && safariVersion < 12) {
    if (!Promise.prototype.finally) {
      Promise.prototype.finally = function(onFinally: any) {
        return this.then(
          (value: any) => Promise.resolve(onFinally()).then(() => value),
          (reason: any) => Promise.resolve(onFinally()).then(() => { throw reason; })
        );
      };
    }
  }

  // Additional polyfills for in-app browsers and older Safari
  if (isInApp || (safariVersion && safariVersion < 15)) {
    // URLPattern polyfill for older Safari
    if (!(window as any).URLPattern) {
      (window as any).URLPattern = class URLPattern {
        constructor(pattern: any) {
          this.pattern = pattern;
        }
        test(url: string) {
          try {
            return new RegExp(this.pattern).test(url);
          } catch {
    return false;
  }
}
        private pattern: any;
      };
    }

    // Enhanced fetch polyfill for in-app browsers
    if (isInApp && typeof fetch === 'function') {
      const originalFetch = window.fetch;
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === 'string' ? input : input.toString();
        
        // Add cache-busting for in-app browsers
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('_inapp', Date.now().toString());
        
        return originalFetch.call(this, urlObj.toString(), {
          ...init,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...init?.headers
          }
        });
      };
    }
  }

  // Enhanced error handling for Safari and in-app browsers
  if (isWebKit) {
    // Add global error handler for syntax errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('Unexpected token') || 
           event.error.message.includes('SyntaxError') ||
           event.error.message.includes('ReferenceError'))) {
        console.error('🚨 Safari/WebKit Error detected:', {
          error: event.error,
          isInApp: isInApp,
          isInstagram: isInstagramBrowser(),
          isFacebook: isFacebookBrowser(),
          safariVersion: safariVersion
        });
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ff6b6b;
          color: white;
          padding: 15px;
          text-align: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
        `;
        
        let errorMessage = 'Safari Compatibility Issue Detected';
        if (isInstagramBrowser()) {
          errorMessage = 'Instagram Browser Compatibility Issue';
        } else if (isFacebookBrowser()) {
          errorMessage = 'Facebook Browser Compatibility Issue';
        }
        
        errorDiv.innerHTML = `
          <strong>${errorMessage}</strong><br>
          Please try refreshing the page or opening in Safari/Chrome for the best experience.
          <br><small>Browser: ${isInApp ? 'In-App' : 'Safari'} ${safariVersion ? `v${safariVersion}` : ''}</small>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 10000);
      }
    });
  }

  // Fix for Safari and in-app browser caching issues
  if (isWebKit) {
    // Force reload if we detect a cached version
    const lastReload = localStorage.getItem('safari-last-reload');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!lastReload || (now - parseInt(lastReload, 10)) > oneHour) {
      localStorage.setItem('safari-last-reload', now.toString());
      
      // Add cache-busting to all script tags
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach((script: any) => {
        if (script.src && !script.src.includes('v=')) {
          const url = new URL(script.src);
          url.searchParams.set('v', Date.now().toString());
          if (isInApp) {
            url.searchParams.set('_inapp', '1');
          }
          script.src = url.toString();
        }
      });
      
      // Add cache-busting to all link tags (CSS)
      const links = document.querySelectorAll('link[href]');
      links.forEach((link: any) => {
        if (link.href && !link.href.includes('v=')) {
          const url = new URL(link.href);
          url.searchParams.set('v', Date.now().toString());
          if (isInApp) {
            url.searchParams.set('_inapp', '1');
          }
          link.href = url.toString();
        }
      });
    }
  }
};

// Safari-specific fetch wrapper
export const safariFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  if (!isSafari()) {
    return fetch(url, options);
  }

  // Add cache-busting for Safari
  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set('_safari', Date.now().toString());
  
  try {
    return await fetch(urlObj.toString(), {
      ...options,
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options?.headers
      }
    });
  } catch (error) {
    console.error('Safari fetch error:', error);
    // Fallback to original URL
    return fetch(url, options);
  }
};

// Initialize Safari compatibility fixes
export const initSafariCompatibility = (): void => {
  // Apply fixes immediately
  applySafariFixes();
  
  // Also apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySafariFixes);
  }
  
  // Apply on window load
  window.addEventListener('load', applySafariFixes);
};