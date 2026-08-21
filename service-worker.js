/* =========================================================
   MINI MANIA — service-worker.js
   Met en cache tous les fichiers nécessaires pour un jeu
   100% fonctionnel hors connexion après la première visite.
   ========================================================= */

const CACHE_NAME = 'minimania-cache-v1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './games/numbers.js',
  './games/colorblocks.js',
  './games/whois.js',
  './games/fruitmerge.js',
  './games/escape.js',
  './games/marblerace.js'
];

// Installation : on met tout en cache immédiatement
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch : on sert le cache en priorité (cache-first), avec repli réseau
// puis mise en cache des nouvelles réponses. Fonctionne 100% hors-ligne
// une fois les fichiers ci-dessus mis en cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Hors-ligne et pas en cache : repli sur la page d'accueil pour la navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
