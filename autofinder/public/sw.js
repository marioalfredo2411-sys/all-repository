/* AutoFinder CO — service worker
 *
 * Estrategias:
 *   · navegaciones            → red primero, cae a /index.html cacheado, luego /offline.html
 *   · /assets/* (con hash)    → cache primero (inmutables, los renombra Vite en cada build)
 *   · resto del mismo origen  → stale-while-revalidate
 *   · tipografías de Google   → cache primero
 *   · imágenes remotas        → stale-while-revalidate con tope de entradas
 *   · api.anthropic.com       → nunca se toca (siempre red)
 */

const VERSION = "v1";
const SHELL_CACHE = `af-shell-${VERSION}`;
const ASSET_CACHE = `af-assets-${VERSION}`;
const FONT_CACHE = `af-fonts-${VERSION}`;
const IMAGE_CACHE = `af-images-${VERSION}`;
const CACHES_ACTUALES = [SHELL_CACHE, ASSET_CACHE, FONT_CACHE, IMAGE_CACHE];

const MAX_IMAGENES = 120;

const SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
  "/icons/favicon-32.png",
  "/icons/favicon-16.png",
];

const NUNCA_CACHEAR = ["api.anthropic.com"];
// El proxy de búsqueda siempre va a la red (las respuestas son streaming y
// dependen de los filtros; cachearlas devolvería resultados de otra consulta).
const RUTAS_SIN_CACHE = ["/api/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll falla en bloque si un recurso falta; los pedimos uno a uno.
      await Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith("af-") && !CACHES_ACTUALES.includes(n))
          .map((n) => caches.delete(n))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (NUNCA_CACHEAR.some((host) => url.hostname.endsWith(host))) return;
  if (url.origin === self.location.origin &&
      RUTAS_SIN_CACHE.some((ruta) => url.pathname.startsWith(ruta))) return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    event.respondWith(manejarNavegacion(event));
    return;
  }

  const mismoOrigen = url.origin === self.location.origin;

  if (mismoOrigen && url.pathname.startsWith("/assets/")) {
    event.respondWith(cachePrimero(request, ASSET_CACHE));
    return;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cachePrimero(request, FONT_CACHE));
    return;
  }

  if (mismoOrigen) {
    event.respondWith(revalidarEnSegundoPlano(request, SHELL_CACHE));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      revalidarEnSegundoPlano(request, IMAGE_CACHE).then(async (res) => {
        await recortarCache(IMAGE_CACHE, MAX_IMAGENES);
        return res;
      })
    );
  }
});

async function manejarNavegacion(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const precargada = await event.preloadResponse;
    const respuesta = precargada || (await fetch(event.request));
    if (respuesta && respuesta.ok) cache.put("/index.html", respuesta.clone());
    return respuesta;
  } catch {
    return (
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      (await cache.match("/offline.html")) ||
      new Response("Sin conexión", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cachePrimero(request, nombreCache) {
  const cache = await caches.open(nombreCache);
  const enCache = await cache.match(request);
  if (enCache) return enCache;
  try {
    const respuesta = await fetch(request);
    if (respuesta && (respuesta.ok || respuesta.type === "opaque")) {
      cache.put(request, respuesta.clone());
    }
    return respuesta;
  } catch (err) {
    return enCache || Response.error();
  }
}

async function revalidarEnSegundoPlano(request, nombreCache) {
  const cache = await caches.open(nombreCache);
  const enCache = await cache.match(request);
  const desdeRed = fetch(request)
    .then((respuesta) => {
      if (respuesta && (respuesta.ok || respuesta.type === "opaque")) {
        cache.put(request, respuesta.clone());
      }
      return respuesta;
    })
    .catch(() => null);
  return enCache || (await desdeRed) || Response.error();
}

async function recortarCache(nombreCache, maximo) {
  const cache = await caches.open(nombreCache);
  const claves = await cache.keys();
  if (claves.length <= maximo) return;
  await Promise.all(claves.slice(0, claves.length - maximo).map((k) => cache.delete(k)));
}
