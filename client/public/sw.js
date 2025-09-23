/**
 * Service Worker for King Ezekiel Academy PWA
 * 
 * This service worker handles:
 * - Push notifications
 * - Background sync
 * - Caching strategies
 * - Offline functionality
 */

const CACHE_NAME = 'king-ezekiel-academy-v6-smart-cache';
const STATIC_CACHE_NAME = 'king-ezekiel-academy-static-v6';
const DYNAMIC_CACHE_NAME = 'king-ezekiel-academy-dynamic-v6';

// Only cache truly static assets that rarely change
const staticUrlsToCache = [
  '/favicon.svg',
  '/manifest.json'
];

// Install event - cache only static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - Smart caching enabled');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(staticUrlsToCache);
    }).then(() => {
      // Clean up old caches but keep current ones
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('king-ezekiel-academy-') && 
                cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches conservatively
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - Smart cache active');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Only delete very old caches, keep recent ones
          if (cacheName.startsWith('king-ezekiel-academy-') && 
              !cacheName.includes('v6') && 
              !cacheName.includes('v5')) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Smart caching with browser compatibility
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }
  
  // Detect if this is an in-app browser or iOS Safari request
  const userAgent = request.headers.get('user-agent') || '';
  const isInAppBrowser = /Instagram|FBAN|FBAV|FBIOS|Line|Twitter|LinkedIn|WhatsApp|Telegram/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(userAgent);
  const isIOSChrome = /CriOS/.test(userAgent);
  
  // For in-app browsers, iOS Safari, and iOS Chrome, use cache-busting logic
  if (isInAppBrowser || isSafari || isIOSSafari || isIOSChrome) {
    console.log('Service Worker: iOS/In-App browser - using cache-busting for:', url.pathname);
    
    if ((isSafari || isInAppBrowser || isIOSSafari || isIOSChrome) && request.url.includes('.js') && request.url.includes('static')) {
      const urlWithCacheBust = new URL(request.url);
      urlWithCacheBust.searchParams.set('v', Date.now().toString());
      if (isInAppBrowser) {
        urlWithCacheBust.searchParams.set('_inapp', '1');
      }
      
      event.respondWith(
        fetch(urlWithCacheBust.toString(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(error => {
          console.error('Service Worker: iOS/Safari/In-App JS fetch error:', error);
          return fetch(request);
        })
      );
    } else if (isInAppBrowser || isIOSSafari || isIOSChrome) {
      const urlWithCacheBust = new URL(request.url);
      if (!urlWithCacheBust.searchParams.has('v')) {
        urlWithCacheBust.searchParams.set('v', Date.now().toString());
      }
      urlWithCacheBust.searchParams.set('_inapp', '1');
      
      event.respondWith(
        fetch(urlWithCacheBust.toString(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(error => {
          console.error('Service Worker: iOS/In-App browser fetch error:', error);
          return fetch(request);
        })
      );
    } else {
      event.respondWith(fetch(request));
    }
    return;
  }
  
  // Smart caching for regular browsers
  console.log('Service Worker: Smart caching for:', url.pathname);
  
  // Strategy 1: Static assets (JS, CSS, images) - Cache First
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            console.log('Service Worker: Serving static asset from cache:', url.pathname);
            return response;
          }
          return fetch(request).then(fetchResponse => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // Strategy 2: API calls - Network First (always fresh data)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase') || url.hostname.includes('flutterwave')) {
    console.log('Service Worker: API call - fetching fresh from network:', url.pathname);
    event.respondWith(
      fetch(request).catch(() => {
        // If network fails, try cache as fallback
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          return cache.match(request);
        });
      })
    );
    return;
  }
  
  // Strategy 3: HTML pages - Network First with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then(response => {
        // Cache successful HTML responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback to cache for offline
        return caches.match(request);
      })
    );
    return;
  }
  
  // Default: Network first for everything else
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  let notificationData = {
    title: 'King Ezekiel Academy',
    body: 'You have a new notification!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'default',
    requireInteraction: false,
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {},
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  // Handle different notification actions
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'learn' || action === 'continue' || action === 'start') {
    // Learning actions - go to dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (action === 'view' || action === 'view-course' || action === 'view-progress') {
    // View actions - go to courses, specific course, or profile for progress
    const courseId = notificationData.courseId;
    const notificationType = notificationData.type;
    
    let url = '/courses';
    if (courseId) {
      url = `/course/${courseId}/overview`;
    } else if (notificationType === 'level-up') {
      url = '/profile'; // For level-up notifications, show progress on profile
    } else if (notificationType === 'course-scheduled' || notificationType === 'course-available' || notificationType === 'course-reminder') {
      url = '/courses'; // For course scheduling notifications, go to courses page
    }
    
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (action === 'keep' || action === 'keep-learning') {
    // Keep learning actions - go to dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (action === 'explore' || action === 'explore-feature') {
    // Explore actions - go to dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (action === 'share' || action === 'share-achievement') {
    // Share actions - go to profile or dashboard
    event.waitUntil(
      clients.openWindow('/profile')
    );
  } else if (action === 'dismiss' || action === 'later' || action === 'not-now' || action === 'not-today' || action === 'not-interested' || action === 'not-ready') {
    // Dismiss actions - just close the notification
    console.log('Service Worker: Notification dismissed');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Service Worker: Processing background sync')
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Script loaded successfully');
