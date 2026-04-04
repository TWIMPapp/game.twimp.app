// Minimal service worker for PWA install support
// Does not cache anything — all data comes from the API

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass through all requests — no caching
  return;
});
