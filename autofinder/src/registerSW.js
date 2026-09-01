/**
 * Registro del service worker.
 *
 * Solo aplica al build web (PWA). Dentro de Capacitor (APK / IPA) el contenido
 * ya viaja empaquetado en el binario, así que el SW sobra y en iOS puede fallar
 * bajo el esquema capacitor://.
 */
export function isNativeApp() {
  return Boolean(globalThis.Capacitor?.isNativePlatform?.());
}

export function registerServiceWorker() {
  if (isNativeApp()) return;
  if (!("serviceWorker" in navigator)) return;
  if (!["https:", "http:"].includes(location.protocol)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // Si ya hay una versión nueva esperando, actívala en la siguiente carga.
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            nuevo.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Recarga una sola vez cuando el SW nuevo toma el control.
      let recargando = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (recargando) return;
        recargando = true;
        location.reload();
      });
    } catch (err) {
      console.warn("[AutoFinder] No se pudo registrar el service worker:", err);
    }
  });
}
