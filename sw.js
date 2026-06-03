// sw.js - Service Worker para Yaqui Lobaina NAILS Pro

const CACHE_NAME = 'yaquilobainanailspro-v49';
const urlsToCache = [
  '/yaquilobainanailspro/',
  '/yaquilobainanailspro/index.html',
  '/yaquilobainanailspro/admin.html',
  '/yaquilobainanailspro/admin-login.html',
  '/yaquilobainanailspro/calendar.html',
  '/yaquilobainanailspro/setup-wizard.html',
  '/yaquilobainanailspro/editar-negocio.html',
  '/yaquilobainanailspro/manifest.json',
  '/yaquilobainanailspro/icons/icon-72x72.png',
  '/yaquilobainanailspro/icons/icon-96x96.png',
  '/yaquilobainanailspro/icons/icon-128x128.png',
  '/yaquilobainanailspro/icons/icon-144x144.png',
  '/yaquilobainanailspro/icons/icon-152x152.png',
  '/yaquilobainanailspro/icons/icon-192x192.png',
  '/yaquilobainanailspro/icons/icon-384x384.png',
  '/yaquilobainanailspro/icons/icon-512x512.png',
  '/yaquilobainanailspro/vendor/react.production.min.js',
  '/yaquilobainanailspro/vendor/react-dom.production.min.js',
  '/yaquilobainanailspro/vendor/babel.min.js',
  '/yaquilobainanailspro/vendor/bcrypt.min.js',
  '/yaquilobainanailspro/vendor/tailwind-browser.js',
  '/yaquilobainanailspro/vendor/lucide/lucide.css',
  '/yaquilobainanailspro/vendor/lucide/lucide.woff2',
  '/yaquilobainanailspro/utils/push-config.js',
  '/yaquilobainanailspro/utils/push-notifications.js'
];

// ============================================
// INSTALACIÓN
// ============================================
self.addEventListener('install', event => {
  console.log('📦 📦 Service Worker instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache creado, guardando archivos...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Error al cachear archivos:', error);
      })
  );
});

// ============================================
// ACTIVACIÓN
// ============================================
self.addEventListener('activate', event => {
  console.log('🔄 🔄 Service Worker activado, limpiando caches antiguos...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado y listo');
      return self.clients.claim();
    })
  );
});

// ============================================
// ESTRATEGIA DE CACHÉ
// ============================================
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean HTTP
  if (!event.request.url.startsWith('http')) return;
  
  // ⚡ ⚠️ NO INTERCEPTAR WHATSAPP (ESENCIAL PARA iOS)
  if (event.request.url.includes('wa.me') || 
      event.request.url.includes('api.whatsapp.com') ||
      event.request.url.includes('whatsapp.com')) {
    console.log('📱 📱 Dejando pasar WhatsApp sin cache');
    return;
  }
  
  // Ignorar otras APIs externas
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('ntfy.sh')) return;
  if (event.request.url.includes('unsplash.com')) return;
  if (event.request.url.includes('cdn.') || 
      event.request.url.includes('unpkg.com') || 
      event.request.url.includes('trickle.so')) {
    return;
  }

  // Estrategia: Network First, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la respuesta es válida, guardar en cache
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('📦 📦 Sirviendo desde cache:', event.request.url);
            return cachedResponse;
          }
          // Si no hay cache y es imagen, devolver icon por defecto
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
            return caches.match('/yaquilobainanailspro/icons/icon-192x192.png');
          }
          return new Response('Error de red', { status: 408 });
        });
      })
  );
});

// ============================================
// MANEJO DE MENSAJES
// ============================================
self.addEventListener('message', event => {
  console.log('📨 📄 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ ⏩ Saltando waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 🧹 Limpiando todo el cache...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🗑️ 🗑️ Cache eliminado:', cacheName);
      });
    });
  }
});

// ============================================
// WEB PUSH OPCIONAL
// ============================================
self.addEventListener('push', event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      title: 'RservasRoma',
      body: event.data ? event.data.text() : 'Tienes una nueva notificación'
    };
  }

  const title = payload.title || 'RservasRoma';
  const options = {
    body: payload.body || 'Tienes una nueva notificación',
    icon: '/yaquilobainanailspro/icons/icon-192x192.png',
    badge: '/yaquilobainanailspro/icons/icon-96x96.png',
    tag: payload.tag || 'rservasroma',
    data: {
      url: payload.url || '/yaquilobainanailspro/admin.html',
      ...(payload.data || {})
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/yaquilobainanailspro/admin.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});

console.log('✅ Service Worker configurado para Yaqui Lobaina NAILS Pro');
console.log('📦 Cache:', CACHE_NAME);
console.log('📄 Archivos a cachear:', urlsToCache.length);
