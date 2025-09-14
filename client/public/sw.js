/**
 * Service Worker for King Ezekiel Academy PWA
 * 
 * This service worker handles:
 * - Push notifications
 * - Background sync
 * - Caching strategies
 * - Offline functionality
 */

const CACHE_NAME = 'king-ezekiel-academy-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.svg',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - DISABLING CACHE');
  // Completely disable caching to force fresh loads
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting ALL caches:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - ALWAYS fetch from network (no caching)
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetch event - BYPASSING CACHE for:', event.request.url);
  // Always fetch from network - no caching at all
  event.respondWith(fetch(event.request));
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
