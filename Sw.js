/* Service worker — Fuerza y Explosividad
   Cachea el "shell" (la propia página y sus iconos) para que se abra
   sin conexión y arranque como app. Los vídeos son externos (Vimeo)
   y NO se cachean. Sube el número de versión cuando cambies el HTML. */
const CACHE = 'fye-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
 
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
 
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo gestionamos peticiones de nuestro propio origen (no Vimeo ni Google)
  if (url.origin !== self.location.origin) return;
  // Red primero para el HTML (para ver siempre la última versión), cache de reserva
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
    return;
  }
  // Resto de assets propios: cache primero
  e.respondWith(caches.match(req).then((m) => m || fetch(req)));
});