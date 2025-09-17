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

// Check if running on old Safari (version < 14)
export const isOldSafari = (): boolean => {
  const version = getSafariVersion();
  return isSafari() && version !== null && version < 14;
};

// Get browser capabilities
export const getBrowserCapabilities = () => {
  const safariVersion = getSafariVersion();
  const isSafariBrowser = isSafari();
  
  return {
    isSafari: isSafariBrowser,
    isIOSSafari: isIOSSafari(),
    version: safariVersion,
    isOldSafari: isOldSafari(),
    supportsOptionalChaining: safariVersion === null || safariVersion >= 14,
    supportsNullishCoalescing: safariVersion === null || safariVersion >= 14,
    supportsObjectFromEntries: safariVersion === null || safariVersion >= 14,
    supportsStringReplaceAll: safariVersion === null || safariVersion >= 13,
    supportsPromiseFinally: safariVersion === null || safariVersion >= 12
  };
};

// Safari-specific polyfills and fixes
export const applySafariFixes = (): void => {
  const safariVersion = getSafariVersion();
  const isSafariBrowser = isSafari();
  
  console.log('🔍 Safari Detection:', {
    isSafari: isSafariBrowser,
    isIOSSafari: isIOSSafari(),
    version: safariVersion,
    userAgent: navigator.userAgent
  });

  if (!isSafariBrowser) return;

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

  // Fix for Safari < 14 - Optional chaining and nullish coalescing
  // These should be handled by Babel, but adding extra safety
  if (safariVersion && safariVersion < 14) {
    // Add global error handler for syntax errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('Unexpected token') || 
           event.error.message.includes('SyntaxError'))) {
        console.error('🚨 Safari Syntax Error detected:', event.error);
        
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
        `;
        errorDiv.innerHTML = `
          <strong>Safari Compatibility Issue Detected</strong><br>
          Please try refreshing the page or using Chrome/Firefox for the best experience.
          <br><small>Safari Version: ${safariVersion}</small>
        `;
        document.body.appendChild(errorDiv);
      }
    });
  }

  // Fix for Safari caching issues
  if (isSafariBrowser) {
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
          script.src = url.toString();
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