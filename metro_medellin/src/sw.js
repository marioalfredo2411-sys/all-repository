/**
 * Service Worker de la PWA.  PLANTILLA: scripts/build-pwa.mjs la copia a
 * dist/sw.js rellenando los dos marcadores de abajo (versión y precache).
 *
 * La versión es un hash del contenido del build, así que cada despliegue
 * invalida el caché anterior automáticamente y nadie se queda con una copia
 * vieja. La versión anterior de este archivo llevaba un número a mano que
 * había que acordarse de subir.
 *
 * Reparto por origen:
 *   shell (HTML, JS, CSS, fuentes, iconos)  precacheado, cache-first
 *   teselas del mapa                        cache-first con tope, para poder
 *                                           volver a ver zonas ya visitadas
 *   Overpass, Supabase, Nominatim           solo red, nunca caché
 */
const VERSION = '__VERSION__';
const SHELL = `metromed-shell-${VERSION}`;
const TILES = 'metromed-tiles';

// Generada en el build a partir de los archivos reales de dist/.
const PRECACHE = __PRECACHE__;

// Cuántas teselas se guardan. ~300 cubre de sobra el Valle de Aburrá a los
// zooms de uso normal sin llenar el disco del teléfono.
const MAX_TILES = 300;

const esTesela = (url) => url.hostname.endsWith('basemaps.cartocdn.com');
const esApi = (url) =>
  url.hostname.includes('overpass-api.de') ||
  url.hostname.includes('supabase.co') ||
  url.hostname.includes('nominatim.openstreetmap.org');

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      // addAll aborta entero si un recurso falla; así un icono ausente no
      // impide instalar el Service Worker.
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((k) => k.startsWith('metromed-') && k !== SHELL && k !== TILES)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/** Recorta el caché de teselas cuando se pasa del tope. */
async function podarTeselas() {
  const c = await caches.open(TILES);
  const claves = await c.keys();
  if (claves.length <= MAX_TILES) return;
  // keys() devuelve en orden de inserción: las primeras son las más antiguas.
  await Promise.all(claves.slice(0, claves.length - MAX_TILES).map((k) => c.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Datos vivos: que fallen si no hay red, en vez de servir algo viejo.
  if (esApi(url)) return;

  // Teselas: primero el caché, y lo que llegue de red se guarda.
  if (esTesela(url)) {
    e.respondWith(
      caches.match(request).then((guardada) =>
        guardada ||
        fetch(request).then((res) => {
          // Las teselas son peticiones opacas (no-cors): no se puede mirar el
          // status, pero se pueden almacenar y volver a servir igual.
          const copia = res.clone();
          caches.open(TILES).then((c) => c.put(request, copia)).then(podarTeselas);
          return res;
        })
      )
    );
    return;
  }

  // El documento: siempre se intenta fresco; el caché es el plan B sin red.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copia = res.clone();
          caches.open(SHELL).then((c) => c.put('./index.html', copia));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Resto del shell: cache-first. El hash de versión ya garantiza frescura.
  e.respondWith(
    caches.match(request).then((guardada) =>
      guardada ||
      fetch(request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const copia = res.clone();
          caches.open(SHELL).then((c) => c.put(request, copia));
        }
        return res;
      })
    )
  );
});

// La página pide activar la versión nueva cuando el usuario acepta el aviso.
self.addEventListener('message', (e) => {
  if (e.data === 'activar-actualizacion') self.skipWaiting();
});
