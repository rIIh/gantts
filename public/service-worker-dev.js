importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.setConfig({
});
workbox.routing.registerRoute(
    new RegExp('https://firebasestorage.googleapis.com/v0/b/crm-freelance.appspot.com/o/(.*)'),
    new workbox.strategies.CacheFirst({
      cacheName: 'storage',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 1000,
          maxAgeSeconds: 24 * 60 * 60, // 24 h
        }),
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200],
        }),
      ],
    })
);
