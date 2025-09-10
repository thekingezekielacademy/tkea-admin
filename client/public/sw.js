/**
 * Service Worker for King Ezekiel Academy
 * 
 * Features:
 * - Static asset caching
 * - API response caching
 * - Offline support
 * - Performance optimization
 * - Background sync
 */

const CACHE_NAME = 'king-ezekiel-academy-v1.0.4';
const STATIC_CACHE = 'static-cache-v5';
const DYNAMIC_CACHE = 'dynamic-cache-v5';

// Add cache versioning
const CACHE_VERSION = '1.0.4';
const STATIC_CACHE_VERSIONED = `${STATIC_CACHE}-${CACHE_VERSION}`;
const DYNAMIC_CACHE_VERSIONED = `${DYNAMIC_CACHE}-${CACHE_VERSION}`;

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/img/linkpreview_image.jpg',
  '/img/og-home.jpg',
  '/img/og-about.jpg',
  '/img/kingezekiel.jpg',
  '/img/blessingadima.jpg'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/courses/,
  /\/api\/blog/,
  /\/api\/categories/,
  /\/api\/paystack/
];

// Authentication endpoints that should NEVER be cached
const AUTH_ENDPOINTS = [
  /\/auth\/v1\//,
  /\/auth\/v1\/token/,
  /\/auth\/v1\/user/,
  /\/auth\/v1\/logout/,
  /\/auth\/v1\/refresh/,
  /\/supabase\/auth\/v1\//,
  /\/supabase\/auth\/v1\/token/,
  /\/supabase\/auth\/v1\/user/,
  /\/supabase\/auth\/v1\/logout/,
  /\/supabase\/auth\/v1\/refresh/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_VERSIONED)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
        // Continue installation even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_VERSIONED && cacheName !== DYNAMIC_CACHE_VERSIONED) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Activation error', error);
        // Continue activation even if cleanup fails
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // CRITICAL: Never cache authentication requests
  if (isAuthRequest(request)) {
    event.respondWith(handleAuthRequest(request));
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

// Check if request is for API
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for authentication
function isAuthRequest(request) {
  const url = new URL(request.url);
  return AUTH_ENDPOINTS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static asset requests
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses only if not already cached
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_VERSIONED);
      // Check if already exists before caching
      const existingResponse = await cache.match(request);
      if (!existingResponse) {
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling static asset', error);
    throw error;
  }
}

// Handle API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Don't cache dynamic endpoints that change frequently
  const noCacheEndpoints = [
    '/api/paystack/test-mode-status',
    '/api/paystack/cancel-subscription'
  ];
  
  const shouldNotCache = noCacheEndpoints.some(endpoint => 
    url.pathname.includes(endpoint)
  );
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && !shouldNotCache) {
      // Cache successful API responses only if not already cached and not in no-cache list
      const cache = await caches.open(DYNAMIC_CACHE_VERSIONED);
      const existingResponse = await cache.match(request);
      if (!existingResponse) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache (but not for no-cache endpoints)
    if (!shouldNotCache) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Network error, please try again later' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses only if not already cached
      const cache = await caches.open(DYNAMIC_CACHE_VERSIONED);
      const existingResponse = await cache.match(request);
      if (!existingResponse) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Handle authentication requests - NEVER cache these
async function handleAuthRequest(request) {
  try {
    // Always fetch from network for auth requests
    const networkResponse = await fetch(request);
    
    // Don't cache auth responses - they contain sensitive tokens
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Auth request failed', error);
    throw error;
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses only if not already cached
      const cache = await caches.open(DYNAMIC_CACHE_VERSIONED);
      const existingResponse = await cache.match(request);
      if (!existingResponse) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Perform background sync tasks
    console.log('Service Worker: Performing background sync');
    
    // Example: Sync offline data
    // await syncOfflineData();
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'King Ezekiel Academy',
    body: 'New notification from King Ezekiel Academy',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'general',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.svg'
      }
    ]
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      // If not JSON, treat as text
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...notificationData.data
    },
    actions: notificationData.actions
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  // Handle different notification actions
  if (action === 'view' || action === 'continue' || action === 'learn' || action === 'explore') {
    event.waitUntil(
      clients.openWindow(notificationData.url || '/')
    );
  } else if (action === 'upgrade') {
    event.waitUntil(
      clients.openWindow('/subscription')
    );
  } else if (action === 'manage') {
    event.waitUntil(
      clients.openWindow('/profile')
    );
  } else if (action === 'certificate') {
    event.waitUntil(
      clients.openWindow('/achievements')
    );
  } else if (action === 'next') {
    event.waitUntil(
      clients.openWindow('/courses')
    );
  } else if (action === 'share') {
    // Handle sharing logic
    event.waitUntil(
      clients.openWindow('/achievements')
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
