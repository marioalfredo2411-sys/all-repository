/**
 * Capa de integración nativa (Capacitor) para Metro Medellín.
 *
 * Se inyecta SOLO en el bundle nativo (`www/`) que genera `scripts/build-www.mjs`.
 * En navegador/PWA el archivo sale temprano y la app sigue usando las APIs web.
 *
 * Qué resuelve:
 *  - Geolocalización: el WebView de Android no pide el permiso de runtime por su
 *    cuenta, así que `navigator.geolocation` queda apuntando al plugin nativo.
 *  - Enlaces externos: `window.open` no funciona dentro del WebView.
 *  - Splash screen, status bar, botón atrás de Android y aviso de sin conexión.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

if (Capacitor.isNativePlatform()) {
  const platform = Capacitor.getPlatform();
  document.documentElement.classList.add('capacitor', `platform-${platform}`);

  setupGeolocation();
  setupExternalLinks(platform);
  setupStatusBar(platform);
  setupBackButton();
  setupNetworkBanner();
  setupSplashHide();
}

// ── GEOLOCALIZACIÓN ──────────────────────────────────────────────────────────
// Sustituye navigator.geolocation por el plugin nativo, manteniendo exactamente
// la misma firma para no tocar el código de la app.
function setupGeolocation() {
  const watchIds = new Map();
  let nextWatchId = 1;

  // Los callbacks de la app esperan un GeolocationPositionError: `code` 1 es
  // permiso denegado, 2 posición no disponible, 3 timeout. El plugin lanza un
  // Error normal, así que el código se marca explícitamente al crearlo (no se
  // deduce del texto: los mensajes están en español y no coincidirían).
  const geoError = (message, code) => {
    const err = new Error(message);
    err.code = code;
    return err;
  };

  const toWebError = (err) => ({
    code: err?.code ?? 2,
    message: err?.message || 'No se pudo obtener la ubicación',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  });

  const ensurePermission = async () => {
    let status = await Geolocation.checkPermissions();
    if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
      status = await Geolocation.requestPermissions({ permissions: ['location'] });
    }
    if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
      throw geoError('Permiso de ubicación denegado', 1);
    }
  };

  const shim = {
    getCurrentPosition(success, error, options = {}) {
      (async () => {
        try {
          await ensurePermission();
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: options.enableHighAccuracy !== false,
            timeout: options.timeout ?? 10000,
            maximumAge: options.maximumAge ?? 0,
          });
          success?.(pos);
        } catch (err) {
          error?.(toWebError(err));
        }
      })();
    },

    watchPosition(success, error, options = {}) {
      const id = nextWatchId++;
      (async () => {
        try {
          await ensurePermission();
          const nativeId = await Geolocation.watchPosition(
            {
              enableHighAccuracy: options.enableHighAccuracy !== false,
              timeout: options.timeout ?? 10000,
              maximumAge: options.maximumAge ?? 0,
            },
            (pos, err) => (err ? error?.(toWebError(err)) : success?.(pos))
          );
          // clearWatch pudo haberse llamado antes de que resolviera el await.
          if (watchIds.has(id)) watchIds.set(id, nativeId);
          else Geolocation.clearWatch({ id: nativeId });
        } catch (err) {
          error?.(toWebError(err));
        }
      })();
      watchIds.set(id, null);
      return id;
    },

    clearWatch(id) {
      const nativeId = watchIds.get(id);
      watchIds.delete(id);
      if (nativeId) Geolocation.clearWatch({ id: nativeId });
    },
  };

  try {
    Object.defineProperty(navigator, 'geolocation', {
      value: shim,
      configurable: true,
      writable: false,
    });
  } catch {
    console.warn('[native] no se pudo reemplazar navigator.geolocation');
  }
}

// ── ENLACES EXTERNOS ─────────────────────────────────────────────────────────
// El botón "Google Maps" usa window.open, que el WebView ignora.
function setupExternalLinks(platform) {
  const openExternal = (url) => {
    // En Android el esquema geo: abre directamente la app de mapas instalada.
    if (platform === 'android') {
      const coords = /[?&]query=(-?[\d.]+),(-?[\d.]+)/.exec(url);
      if (coords) {
        const [, lat, lng] = coords;
        window.location.href = `geo:${lat},${lng}?q=${lat},${lng}&z=17`;
        return;
      }
    }
    // iOS: SFSafariViewController respeta los universal links de Google Maps.
    Browser.open({ url, presentationStyle: 'popover' }).catch(() => {
      window.location.href = url;
    });
  };

  window.open = (url) => {
    if (url) openExternal(String(url));
    return null;
  };

  // Enlaces <a target="_blank"> o http(s) que saldrían del WebView.
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!/^https?:\/\//i.test(href)) return;
      e.preventDefault();
      openExternal(href);
    },
    true
  );
}

// ── STATUS BAR ───────────────────────────────────────────────────────────────
function setupStatusBar(platform) {
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  if (platform === 'android') {
    StatusBar.setBackgroundColor({ color: '#0a0e1a' }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  }
}

// ── BOTÓN ATRÁS (ANDROID) ────────────────────────────────────────────────────
function setupBackButton() {
  let lastBack = 0;

  App.addListener('backButton', () => {
    const visible = (id) => document.getElementById(id)?.classList.contains('visible');

    if (visible('correction-overlay') || visible('map-pick-banner')) {
      window.cancelCorrection?.();
      return;
    }
    if (visible('info-card')) {
      window.closeInfoCard?.();
      return;
    }
    if (document.getElementById('sidebar')?.classList.contains('open')) {
      window.toggleSidebar?.();
      return;
    }

    const now = Date.now();
    if (now - lastBack < 2000) {
      App.exitApp();
    } else {
      lastBack = now;
      window.showToast?.('Presiona atrás otra vez para salir');
    }
  });
}

// ── SIN CONEXIÓN ─────────────────────────────────────────────────────────────
// Los tiles del mapa y Overpass son remotos: sin red la app se ve vacía.
function setupNetworkBanner() {
  const banner = document.createElement('div');
  banner.id = 'offline-banner';
  banner.textContent = 'Sin conexión · el mapa puede no cargar';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));

  const render = (connected) => banner.classList.toggle('visible', !connected);

  Network.getStatus().then((s) => render(s.connected)).catch(() => {});
  Network.addListener('networkStatusChange', (s) => render(s.connected));
}

// ── SPLASH ───────────────────────────────────────────────────────────────────
// launchAutoHide está en false: la ocultamos cuando el mapa ya pintó, para no
// mostrar un lienzo en blanco mientras Leaflet se inicializa.
function setupSplashHide() {
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
  };

  const whenReady = () => {
    // `map` es un `let` de script clásico (no está en window), así que el
    // indicador fiable de que Leaflet ya pintó es el primer tile cargado.
    const start = Date.now();
    const poll = setInterval(() => {
      const painted = document.querySelector('#map .leaflet-tile-loaded');
      if (painted || Date.now() - start > 4000) {
        clearInterval(poll);
        setTimeout(hide, 250);
      }
    }, 100);
  };

  if (document.readyState === 'complete') whenReady();
  else window.addEventListener('load', whenReady);

  // Red de seguridad: nunca dejar la splash pegada.
  setTimeout(hide, 6000);
}
