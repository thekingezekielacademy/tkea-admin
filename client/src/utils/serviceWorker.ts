/**
 * Service Worker Registration and Management
 * 
 * This file handles:
 * - Service worker registration
 * - Update detection and notification
 * - Cache management
 * - Performance monitoring
 */

// Service worker registration
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Only register if sw.js exists
      const swExists = await fetch('/sw.js', { method: 'HEAD' }).then(r => r.ok).catch(() => false);
      if (!swExists) {
        console.log('Service Worker file not found, skipping registration');
        return;
      }
      
      // Clear all existing caches before registering new service worker
      await clearAllCaches();
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        // Force update by using a unique scope
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              showUpdateNotification();
            }
          });
        }
      });
      
      // Handle service worker activation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker activated');
        // Only reload if not in the middle of authentication
        const isAuthPage = window.location.pathname.includes('/signin') || 
                          window.location.pathname.includes('/signup') ||
                          window.location.pathname.includes('/forgot-password');
        
        if (!isAuthPage) {
          // Small delay to allow auth state to stabilize
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Show update notification
const showUpdateNotification = (): void => {
  // Create update notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <span>🔄 New version available</span>
      <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">
        Update
      </button>
      <button id="dismiss-btn" class="text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle update button click
  const updateBtn = notification.querySelector('#update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // Handle dismiss button click
  const dismissBtn = notification.querySelector('#dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      notification.remove();
    });
  }
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
};

// Unregister service worker
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
};

// Clear all caches
export const clearAllCaches = async (): Promise<void> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }
};

// Get cache storage info
export const getCacheInfo = async (): Promise<{
  cacheNames: string[];
  totalSize: number;
  cacheDetails: Array<{ name: string; size: number; keys: string[] }>;
}> => {
  if (!('caches' in window)) {
    return { cacheNames: [], totalSize: 0, cacheDetails: [] };
  }
  
  try {
    const cacheNames = await caches.keys();
    const cacheDetails = await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const size = keys.length; // Simplified size calculation
        
        return {
          name: cacheName,
          size,
          keys: keys.map(key => key.url)
        };
      })
    );
    
    const totalSize = cacheDetails.reduce((sum, cache) => sum + cache.size, 0);
    
    return {
      cacheNames,
      totalSize,
      cacheDetails
    };
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return { cacheNames: [], totalSize: 0, cacheDetails: [] };
  }
};

// Check if service worker is active
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch (error) {
    return false;
  }
};

// Send message to service worker
export const sendMessageToServiceWorker = async (message: any): Promise<any> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.active) {
      throw new Error('Service Worker not active');
    }
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      registration.active.postMessage(message, [messageChannel.port2]);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Service Worker message timeout'));
      }, 5000);
    });
  } catch (error) {
    console.error('Failed to send message to Service Worker:', error);
    throw error;
  }
};

// Performance monitoring for service worker
export const monitorServiceWorkerPerformance = (): void => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  // Monitor service worker performance
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
      console.log('Service Worker Performance:', event.data.metric);
      
      // Send to analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'service_worker_performance', {
          metric_name: event.data.metric.name,
          metric_value: event.data.metric.value,
          metric_unit: event.data.metric.unit
        });
      }
    }
  });
};

// Initialize service worker with performance monitoring
export const initializeServiceWorker = async (): Promise<void> => {
  await registerServiceWorker();
  monitorServiceWorkerPerformance();
  
  // Log service worker status
  const isActive = await isServiceWorkerActive();
  console.log('Service Worker Status:', isActive ? 'Active' : 'Inactive');
  
  // Get cache info
  const cacheInfo = await getCacheInfo();
  console.log('Cache Info:', cacheInfo);
};

// Export for use in other files
const serviceWorkerUtils = {
  registerServiceWorker,
  unregisterServiceWorker,
  clearAllCaches,
  getCacheInfo,
  isServiceWorkerActive,
  sendMessageToServiceWorker,
  monitorServiceWorkerPerformance,
  initializeServiceWorker
};

export default serviceWorkerUtils;
