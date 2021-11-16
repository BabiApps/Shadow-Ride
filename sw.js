var cacheName = 'shadowride-pwa';
var filesToCache = [
  '/',
  '/index.html',
  '/ShadowRide_logo_3-11.png'
]; /*,
  '/suncalc.js',
  '/fun.js',
  '/OpenLayers.js',
  '/manifest.json',
];*/

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});