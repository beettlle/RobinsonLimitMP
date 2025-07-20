const CACHE_NAME = 'robinson-limit-mp-v1.4.0';
const STATIC_CACHE_NAME = 'robinson-limit-mp-static-v1.4.0';
const DYNAMIC_CACHE_NAME = 'robinson-limit-mp-dynamic-v1.4.0';

// Files to cache immediately (static assets)
const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './weather-service.js',
    './local-sensor-service.js',
    './location-service.js',
    './airports-data.json',
    './config.js',
    './manifest.json',
    './version.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {

                return cache.addAll(STATIC_FILES);
            })
            .then(() => {

                return self.skipWaiting();
            })
            .catch((error) => {

            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {

                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {

                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (url.pathname === '/version.js') {
        // Version file - use network-first strategy to check for updates
        event.respondWith(networkFirst(request));
    } else if (url.origin === location.origin) {
        // Same-origin requests - use cache-first strategy
        event.respondWith(cacheFirst(request));
    } else if (url.href.includes('cdn.jsdelivr.net')) {
        // CDN requests (Chart.js) - use cache-first strategy
        event.respondWith(cacheFirst(request));
    } else {
        // Other external requests - use network-first strategy
        event.respondWith(networkFirst(request));
    }
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {

            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {

        
        // Return offline page if available
        if (request.destination === 'document') {
            const offlineResponse = await caches.match('./index.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        throw error;
    }
}

// Network-first strategy for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {

        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Background sync for offline actions (if needed in future)
self.addEventListener('sync', (event) => {

    // Future: Handle background sync for offline actions
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {

    // Future: Handle push notifications
}); 