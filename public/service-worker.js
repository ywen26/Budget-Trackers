const CACHE_BUDGET = "static-cache-v1";
const DATA_CACHE_BUDGET = "data-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/styles.css",
  "/index.js",
  "/db.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// install
self.addEventListener("install", function(event) {
  // pre cache budget data
  event.waitUntil(
    caches.open(DATA_CACHE_BUDGET).then((cache) => cache.add("/api/transaction"))
  );
    
  // pre cache all static assets
  event.waitUntil(
    caches.open(CACHE_BUDGET).then((cache) => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_BUDGET && key !== DATA_CACHE_BUDGET) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(event) {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_BUDGET).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }

            return response;
          })
          .catch(error => {
            // Network request failed, try to get it from the cache
            return cache.match(event.request);
          });
      }).catch(error => console.log(error))
    );

    return;
  }

  event.respondWith(
    caches.open(CACHE_BUDGET).then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request);
      });
    })
  );
});