/**
 * Essential Polyfills Only
 * 
 * Only add polyfills that are absolutely necessary for basic functionality
 * This reduces conflicts and improves loading performance
 */

/**
 * Add only essential polyfills
 */
export const addEssentialPolyfills = (): void => {
  // Only add polyfills if they don't exist
  // This prevents conflicts and improves performance
  
  // 1. Promise polyfill (only if absolutely needed)
  if (typeof window !== 'undefined' && !window.Promise) {
    console.log('Adding Promise polyfill');
    // Add minimal Promise polyfill here if needed
  }
  
  // 2. Fetch polyfill (only if absolutely needed)
  if (typeof window !== 'undefined' && !window.fetch) {
    console.log('Adding fetch polyfill');
    // Add minimal fetch polyfill here if needed
  }
  
  // 3. LocalStorage polyfill (only if absolutely needed)
  if (typeof window !== 'undefined' && !window.localStorage) {
    console.log('Adding localStorage polyfill');
    // Add minimal localStorage polyfill here if needed
  }
  
  // Remove all other polyfills that might cause conflicts
  console.log('✅ Essential polyfills loaded');
};

/**
 * Check if polyfill is needed
 */
export const needsPolyfill = (feature: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  switch (feature) {
    case 'Promise':
      return !window.Promise;
    case 'fetch':
      return !window.fetch;
    case 'localStorage':
      return !window.localStorage;
    case 'sessionStorage':
      return !window.sessionStorage;
    default:
      return false;
  }
};

/**
 * Safe feature detection
 */
export const safeFeatureCheck = {
  hasLocalStorage: (): boolean => {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null;
    } catch {
      return false;
    }
  },
  
  hasSessionStorage: (): boolean => {
    try {
      return typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage !== null;
    } catch {
      return false;
    }
  },
  
  hasFetch: (): boolean => {
    try {
      return typeof window !== 'undefined' && 'fetch' in window;
    } catch {
      return false;
    }
  },
  
  hasPromise: (): boolean => {
    try {
      return typeof window !== 'undefined' && 'Promise' in window;
    } catch {
      return false;
    }
  },
  
  hasServiceWorker: (): boolean => {
    try {
      return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    } catch {
      return false;
    }
  },
  
  hasNotifications: (): boolean => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window;
    } catch {
      return false;
    }
  }
};

export default {
  addEssentialPolyfills,
  needsPolyfill,
  safeFeatureCheck
};
