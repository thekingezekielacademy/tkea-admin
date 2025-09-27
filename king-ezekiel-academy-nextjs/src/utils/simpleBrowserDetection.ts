/**
 * Simplified Browser Detection
 * 
 * Single, reliable browser detection system that works consistently
 * across iOS Safari and in-app browsers without over-engineering
 */

export interface SimpleBrowserInfo {
  isMobile: boolean;
  isInApp: boolean;
  isSafari: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isIOSSafari: boolean;
  isIOSChrome: boolean;
  userAgent: string;
}

/**
 * Get comprehensive browser information with single detection
 */
export const getBrowserInfo = (): SimpleBrowserInfo => {
  if (typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isInApp: false,
      isSafari: false,
      isIOS: false,
      isAndroid: false,
      isIOSSafari: false,
      isIOSChrome: false,
      userAgent: ''
    };
  }

  const ua = navigator.userAgent;
  
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isInApp: /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua),
    isSafari: /Safari/i.test(ua) && !/Chrome|CriOS|EdgA|Firefox|FxiOS|OPR|Vivaldi/i.test(ua),
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/i.test(ua),
    isIOSSafari: /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua),
    isIOSChrome: /CriOS/.test(ua),
    userAgent: ua
  };
};

/**
 * Check if we should use simplified features for compatibility
 */
export const shouldUseSimplifiedMode = (): boolean => {
  const browserInfo = getBrowserInfo();
  
  // Use simplified mode for:
  // 1. In-app browsers (Instagram, Facebook, etc.)
  // 2. Old iOS Safari (version < 14)
  // 3. Android WebView
  
  if (browserInfo.isInApp) return true;
  
  // Use simplified mode for iOS Safari and iOS Chrome
  if (browserInfo.isIOSSafari || browserInfo.isIOSChrome) return true;
  
  if (browserInfo.isIOS) {
    const versionMatch = browserInfo.userAgent.match(/OS (\d+)_/);
    const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
    if (version > 0 && version < 14) return true;
  }
  
  return false;
};

/**
 * Get viewport meta tag content based on browser
 */
export const getViewportContent = (): string => {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isInApp) {
    // For in-app browsers, use basic viewport
    return 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
  
  if (browserInfo.isIOSSafari || browserInfo.isIOSChrome) {
    // For iOS Safari and iOS Chrome, use optimized viewport
    return 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  }
  
  if (browserInfo.isIOS) {
    // For other iOS browsers, use standard viewport
    return 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  }
  
  // For other browsers, use full viewport
  return 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
};

/**
 * Check if browser supports modern features
 */
export const supportsModernFeatures = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return !!(
      window.fetch &&
      window.Promise &&
      window.localStorage &&
      window.sessionStorage &&
      'serviceWorker' in navigator
    );
  } catch {
    return false;
  }
};

/**
 * Apply essential browser fixes
 */
export const applyBrowserFixes = (): void => {
  const browserInfo = getBrowserInfo();
  
  // Fix iOS Safari and iOS Chrome viewport issues
  if (browserInfo.isIOSSafari || browserInfo.isIOSChrome || browserInfo.isIOS) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', getViewportContent());
    }
    
    // Fix touch events for iOS
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    // Fix scroll issues
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    
    // iOS Safari specific fixes
    if (browserInfo.isIOSSafari) {
      // Prevent iOS Safari from hiding the address bar
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 0);
      });
      
      // Fix iOS Safari memory issues
      window.addEventListener('pagehide', () => {
        // Clear any temporary storage on page unload
        if ((window as any).__tempStorage) {
          (window as any).__tempStorage = {};
        }
      });
    }
  }
  
  // Fix in-app browser issues
  if (browserInfo.isInApp) {
    // Disable complex features that might not work
    console.log('🔧 In-app browser detected - using simplified mode');
    
    // CRITICAL: Fix hash routing for mini browsers
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#/';
      console.log('🔧 Fixed hash for mini browser:', window.location.hash);
    }
    
    // Add cache-busting for in-app browsers
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script: any) => {
      if (script.src && !script.src.includes('v=')) {
        const url = new URL(script.src);
        url.searchParams.set('v', Date.now().toString());
        script.src = url.toString();
      }
    });
    
    // Disable problematic features for mini browsers
    if (typeof window !== 'undefined') {
      // Disable service worker in mini browsers if it causes issues
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            if (registration.scope.includes('localhost') || registration.scope.includes('vercel')) {
              registration.unregister();
              console.log('🔧 Unregistered service worker for mini browser compatibility');
            }
          });
        });
      }
    }
  }
};

// Global browser info for easy access
if (typeof window !== 'undefined') {
  (window as any).browserInfo = getBrowserInfo();
}

export default {
  getBrowserInfo,
  shouldUseSimplifiedMode,
  getViewportContent,
  supportsModernFeatures,
  applyBrowserFixes
};
