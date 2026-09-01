// Service Worker para Juegos CCI AL PWA
const CACHE_NAME = "juegos-cci-al-v1";
// Rutas que existen tanto en desarrollo como en la build de producción.
// El resto de assets (JS/CSS con hash) se cachean bajo demanda en el handler de fetch.
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cache abierto");
      // allSettled: que una ruta falle no debe abortar la instalación del SW
      return Promise.allSettled(urlsToCache.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Eliminando cache viejo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network First, Fall back to Cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear solicitudes a APIs externas
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Respuestas válidas se devuelven directamente
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          // Clonar la respuesta
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, mostrar offline page
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          // Para otros tipos de requests, devolver una respuesta vacía
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        })
    );
    return;
  }

  // Para recursos locales: Cache First, Fall back to Network
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log("Service Worker: Sirviendo desde cache:", request.url);
          return response;
        }
        return fetch(request)
          .then((response) => {
            // No cachear respuestas inválidas
            if (!response || response.status !== 200) {
              return response;
            }
            // Clonar y cachear la respuesta
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Si no hay conexión y no está en cache
            if (request.mode === "navigate") {
              return caches.match("/offline.html");
            }
            return new Response("Offline", { status: 503 });
          });
      })
    );
  } else {
    // Para non-GET requests, usar Network First
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return new Response("Offline", { status: 503 });
        })
    );
  }
});

// Sincronización en background (si la app necesita sincronizar datos)
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Sincronización en background");
  if (event.tag === "sync-games") {
    event.waitUntil(
      // Implementar lógica de sincronización si es necesaria
      Promise.resolve()
    );
  }
});

// Push Notifications (opcional)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "Nueva notificación de Juegos CCI AL",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect fill='%231A6B55' width='192' height='192'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='80' font-weight='bold' fill='%23F47920' font-family='Segoe UI, sans-serif'%3EJ%3C/text%3E%3C/svg%3E",
    badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect fill='%231A6B55' width='96' height='96'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='60' font-weight='bold' fill='%23FFFFFF'%3EJ%3C/text%3E%3C/svg%3E",
    tag: "juegos-cci-al-notification",
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification("Juegos CCI AL", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
