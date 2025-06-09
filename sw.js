// Service Worker for Stock Ristorante PWA
const CACHE_NAME = 'stock-ristorante-v1.1.0';
const STATIC_CACHE = 'stock-static-v1.1.0';
const DYNAMIC_CACHE = 'stock-dynamic-v1.1.0';

// Core app files that must be cached for offline functionality
const CORE_CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Additional resources that enhance offline experience
const OPTIONAL_CACHE_FILES = [
  // Add any external fonts or resources here if needed
];

// All files to cache initially
const urlsToCache = [...CORE_CACHE_FILES, ...OPTIONAL_CACHE_FILES];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(CORE_CACHE_FILES);
      }),
      // Prepare dynamic cache
      caches.open(DYNAMIC_CACHE).then(() => {
        console.log('Service Worker: Dynamic cache ready');
      })
    ])
    .then(() => {
      console.log('Service Worker: All caches initialized');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('Service Worker: Cache initialization failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated and old caches cleaned');
      return self.clients.claim();
    })
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (except for essential CDN resources)
  if (!event.request.url.startsWith(self.location.origin)) {
    // Allow caching of essential external resources like fonts
    const isEssentialExternal = event.request.url.includes('fonts.googleapis.com') ||
                               event.request.url.includes('fonts.gstatic.com') ||
                               event.request.url.includes('cdnjs.cloudflare.com');
    
    if (!isEssentialExternal) {
      return;
    }
  }

  // Determine caching strategy based on request type
  const isStaticResource = CORE_CACHE_FILES.some(file => 
    event.request.url.endsWith(file.replace('./', ''))
  ) || event.request.url.includes('.css') || 
       event.request.url.includes('.js') || 
       event.request.url.includes('.png') || 
       event.request.url.includes('.jpg') || 
       event.request.url.includes('.svg') ||
       event.request.url.includes('manifest.json');

  if (isStaticResource) {
    // Cache-first strategy for static resources
    event.respondWith(cacheFirst(event.request));
  } else {
    // Network-first strategy for dynamic content
    event.respondWith(networkFirst(event.request));
  }
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache (cache-first)', request.url);
      return cachedResponse;
    }

    console.log('Service Worker: Fetching from network (cache-first)', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache-first failed', error);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    
    throw error;
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirst(request) {
  try {
    console.log('Service Worker: Fetching from network (network-first)', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache (network-first)', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    
    console.error('Service Worker: Network-first failed completely', error);
    throw error;
  }
}

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'stock-sync') {
    event.waitUntil(
      // Here you could implement background sync logic
      // For example, sync pending stock changes when back online
      Promise.resolve()
    );
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Notifica Stock Ristorante',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Visualizza',
        icon: './icon-192.png'
      },
      {
        action: 'close',
        title: 'Chiudi',
        icon: './icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Stock Ristorante', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled rejection', event.reason);
  event.preventDefault();
});