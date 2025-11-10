const CACHE_NAME = 'ipvdu-barrios-v1.1';

// Detectar la ruta base correcta
const BASE_PATH = self.location.pathname.includes('/Sistemas_Barrios_IPV/') 
  ? '/Sistemas_Barrios_IPV/' 
  : '/';

const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}js/datos.js`,
  `${BASE_PATH}Imag/favicon.png`,
  `${BASE_PATH}Imag/icon-192.png`,
  `${BASE_PATH}Imag/icon-512.png`,
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache abierto, agregando archivos...');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .then(() => {
        console.log('[SW] Todos los archivos cacheados correctamente');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('[SW] Error al cachear archivos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim(); // Tomar control inmediatamente
    })
  );
});

// Intercepción de peticiones - Estrategia Network First
self.addEventListener('fetch', event => {
  // Ignorar peticiones no-GET y de otros orígenes
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde el cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en cache, devolver página offline personalizada
          if (event.request.destination === 'document') {
            return caches.match(`${BASE_PATH}index.html`);
          }
        });
      })
  );
});
