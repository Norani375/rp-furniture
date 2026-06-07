self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('erp-v1').then((cache) => cache.addAll(['/'])));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});