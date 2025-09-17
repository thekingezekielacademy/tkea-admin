// Instagram Mini Browser Compatibility Fix
// Instagram's in-app browser has very limited JavaScript support

export const isInstagramBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('instagram') || 
         userAgent.includes('fbav') || 
         userAgent.includes('fban') ||
         userAgent.includes('fbsv');
};

export const isMiniBrowser = (): boolean => {
  // DISABLED: Always return false to allow full app functionality
  // Instagram/Facebook browsers should load the full React app
  return false;
};

// Safe feature detection for mini browsers
export const safeFeatureCheck = {
  // Check if localStorage is available
  hasLocalStorage: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      // Allow mini browsers to use localStorage - they often support it
      return 'localStorage' in window && window.localStorage !== null;
    } catch {
      return false;
    }
  },

  // Check if clipboard API is available
  hasClipboard: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      // Allow mini browsers to attempt clipboard access
      return 'navigator' in window && 'clipboard' in navigator;
    } catch {
      return false;
    }
  },

  // Check if notifications are available
  hasNotifications: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      // Allow mini browsers to attempt notification access
      return 'Notification' in window;
    } catch {
      return false;
    }
  },

  // Check if service workers are available
  hasServiceWorker: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      // Allow mini browsers to attempt service worker access
      return 'serviceWorker' in navigator;
    } catch {
      return false;
    }
  },

  // Check if fetch is available
  hasFetch: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      return 'fetch' in window;
    } catch {
      return false;
    }
  }
};

// Safe clipboard fallback
export const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  if (safeFeatureCheck.hasClipboard()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for mini browsers
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
};

// Safe storage fallback
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (safeFeatureCheck.hasLocalStorage()) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    if (safeFeatureCheck.hasLocalStorage()) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};
