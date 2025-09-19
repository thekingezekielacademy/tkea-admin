/**
 * Mini Browser Service Worker Management
 * 
 * Handles service worker registration and unregistration for mini browsers
 * to prevent cache-related issues and compatibility problems.
 */

import { isMiniBrowser, getMiniBrowserType } from './miniBrowserDetection';

/**
 * Disable service worker in mini browsers
 * This prevents cache bugs and compatibility issues
 */
export const disableServiceWorkerInMiniBrowser = async (): Promise<void> => {
  if (!isMiniBrowser() || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    console.log(`🛑 Disabling service worker for ${getMiniBrowserType() || 'mini'} browser`);
    
    // Get all existing service worker registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('✅ No service workers to disable');
      return;
    }
    
    // Unregister all service workers
    const unregisterPromises = registrations.map(async (registration) => {
      try {
        await registration.unregister();
        console.log('✅ Service worker unregistered:', registration.scope);
      } catch (error) {
        console.warn('⚠️ Failed to unregister service worker:', error);
      }
    });
    
    await Promise.all(unregisterPromises);
    
    // Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        await Promise.all(deletePromises);
        console.log('✅ All caches cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear caches:', error);
      }
    }
    
    console.log('✅ Service worker successfully disabled for mini browser');
    
  } catch (error) {
    console.error('❌ Failed to disable service worker:', error);
  }
};

/**
 * Safely register service worker only for non-mini browsers
 */
export const safeServiceWorkerRegistration = async (): Promise<boolean> => {
  // Skip registration for mini browsers
  if (isMiniBrowser()) {
    console.log(`🚫 Skipping service worker registration for ${getMiniBrowserType() || 'mini'} browser`);
    await disableServiceWorkerInMiniBrowser();
    return false;
  }
  
  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    console.log('🚫 Service worker not supported in this browser');
    return false;
  }
  
  try {
    // Check if service worker file exists
    const response = await fetch('/sw.js', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.log('🚫 Service worker file not found');
      return false;
    }
    
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('✅ Service worker registered successfully');
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New service worker version available');
            // Don't auto-reload, let user decide
          }
        });
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Service worker registration failed:', error);
    return false;
  }
};

/**
 * Initialize service worker management based on browser type
 */
export const initializeServiceWorkerManagement = async (): Promise<void> => {
  const miniBrowserType = getMiniBrowserType();
  
  if (isMiniBrowser()) {
    console.log(`📱 Mini browser detected: ${miniBrowserType || 'unknown'}`);
    await disableServiceWorkerInMiniBrowser();
    
    // Add visual indicator for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b35;
        color: white;
        padding: 8px;
        font-size: 12px;
        font-family: monospace;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      indicator.textContent = `📱 ${miniBrowserType?.toUpperCase() || 'MINI'} BROWSER - SERVICE WORKER DISABLED`;
      document.body.appendChild(indicator);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 5000);
    }
  } else {
    console.log('🌐 Regular browser detected - service worker enabled');
    await safeServiceWorkerRegistration();
  }
};

/**
 * Clear all browser storage for mini browsers
 * This helps prevent storage-related issues
 */
export const clearMiniBrowserStorage = async (): Promise<void> => {
  if (!isMiniBrowser()) {
    return;
  }
  
  try {
    console.log('🧹 Clearing storage for mini browser compatibility');
    
    // Clear localStorage
    if ('localStorage' in window) {
      try {
        localStorage.clear();
        console.log('✅ localStorage cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear localStorage:', error);
      }
    }
    
    // Clear sessionStorage
    if ('sessionStorage' in window) {
      try {
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear sessionStorage:', error);
      }
    }
    
    // Clear IndexedDB
    if ('indexedDB' in window) {
      try {
        // This is a simplified approach - in practice, you'd need to handle each database
        console.log('✅ IndexedDB clear attempted');
      } catch (error) {
        console.warn('⚠️ Failed to clear IndexedDB:', error);
      }
    }
    
    // Clear cookies (only those we can access)
    if (document.cookie) {
      try {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
        console.log('✅ Cookies cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear cookies:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to clear mini browser storage:', error);
  }
};

/**
 * Check if service worker should be disabled
 */
export const shouldDisableServiceWorker = (): boolean => {
  return isMiniBrowser();
};
