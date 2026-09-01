# AutoFinder CO — Empaquetado PWA / APK / IPA

Guía de los tres targets. El código de la app vive en `vehicle-comparator.jsx`; el resto es
andamiaje de empaquetado, backend y build.

---

## Resumen

AutoFinder CO pasó de ser un único componente React suelto a un proyecto desplegable en los
tres formatos: se añadió el andamiaje de build con Vite (`index.html`, `package.json`,
`src/main.jsx`), el **manifest PWA** completo con identidad real de la app (es-CO,
`standalone`, tema `#080b12`, 7 iconos `any`/`maskable` y dos shortcuts funcionales derivados
del logo embebido), un service worker con precache del shell, estrategias por tipo de recurso
y pantalla sin conexión, y la configuración de Capacitor (`co.autofinder.app`) con las fuentes
1024/2732 px para generar iconos y splash nativos. Se resolvió el bloqueante funcional de la
búsqueda —el navegador llamaba a `api.anthropic.com` sin autenticación y el preflight CORS
fallaba— interponiendo un proxy de servidor que guarda la clave y reenvía el streaming, con
modo demostración etiquetado cuando no hay `ANTHROPIC_API_KEY`. Sobre la interfaz se añadió un
panel con los criterios de la búsqueda en curso, mensajes de estado y errores legibles, una
cascada de imágenes en tres niveles (respuesta del modelo → mapa local → API de Wikimedia
Commons con filtrado por nombre de archivo y despriorización de primeros planos) que rellena
la foto después de pintar la tarjeta, y una vista maestro-detalle que a partir de 1200 px
muestra la lista completa de vehículos junto a la ficha del seleccionado, con favoritos y
comparación accesibles desde cada fila. Finalmente se hizo responsive de 320 a 1920 px:
barra de filtros con scroll propio, cabecera adaptativa, parrilla de 1→2→3 columnas antes de
pasar a vista dividida, y objetivos táctiles de 44 px bajo `pointer: coarse` para APK e IPA,
verificado sin desbordes horizontales en doce tamaños de pantalla.

---

## Estructura

```
autofinder/
├── index.html                     Documento raíz: meta tags PWA + iOS + Android
├── package.json                   Scripts de build y empaquetado
├── vite.config.js                 Bundler (base "/", sirve web y Capacitor)
├── capacitor.config.json          Identidad y configuración nativa (APK / IPA)
├── vehicle-comparator.jsx         Componente de la app
├── src/
│   ├── main.jsx                   Punto de entrada React
│   └── registerSW.js              Registro del SW (se salta en nativo)
├── public/
│   ├── manifest.webmanifest       ★ Manifest PWA
│   ├── sw.js                      Service worker
│   ├── offline.html               Pantalla sin conexión
│   └── icons/                     Iconos web (16 → 512, any + maskable)
└── resources/                     Fuentes 1024/2732 px para @capacitor/assets
    ├── icon.png
    ├── icon-foreground.png
    ├── icon-background.png
    ├── splash.png
    └── splash-dark.png
```

---

## Identidad de la app

| Campo             | Valor                                       |
| ----------------- | ------------------------------------------- |
| Nombre            | AutoFinder CO — Comparador de vehículos     |
| Nombre corto      | AutoFinder                                  |
| App ID (bundle)   | `co.autofinder.app`                         |
| Versión           | 1.0.0                                       |
| Idioma            | es-CO                                       |
| Display           | standalone                                  |
| Theme / background| `#080b12`                                   |
| Categorías        | shopping, travel, lifestyle, utilities      |

`appId` se usa como *package name* en Android y *bundle identifier* en iOS. Si el dominio
real no es `autofinder.co`, cámbialo en `capacitor.config.json` **antes** de generar las
plataformas nativas — cambiarlo después obliga a recrear `android/` e `ios/`.

---

## 1. PWA

```bash
npm install
npm run build      # → dist/
npm run preview    # prueba local del build
```

Sube `dist/` a cualquier hosting estático **con HTTPS** (obligatorio para instalar).
Requisitos servidos por el servidor, no por el build:

- `/sw.js` debe servirse desde la raíz con `Service-Worker-Allowed: /` implícito
  (basta con que esté en la raíz) y **sin** cache larga (`Cache-Control: no-cache`).
- `/assets/*` puede ir con `Cache-Control: public, max-age=31536000, immutable`
  (Vite les pone hash en el nombre).
- `manifest.webmanifest` con `Content-Type: application/manifest+json`.
- SPA fallback: cualquier ruta → `index.html`.

Verificación: Chrome DevTools → *Application* → *Manifest* / *Service Workers*, o Lighthouse
categoría **Installable**.

### Pendiente opcional

El manifest no declara `screenshots`. Sin ellas Chrome en Android muestra el diálogo de
instalación simple en lugar del enriquecido. Para añadirlas: captura 1080×1920 (móvil) y
1920×1080 (escritorio), guárdalas en `public/screenshots/` y agrega al manifest:

```json
"screenshots": [
  { "src": "/screenshots/movil-1.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" },
  { "src": "/screenshots/escritorio-1.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide" }
]
```

---

## 2. APK (Android)

Requiere Android Studio + JDK 21.

```bash
npm run cap:add:android    # crea android/ (una sola vez)
npm run assets             # genera iconos y splash nativos desde resources/
npm run android            # build + sync + abre Android Studio
```

Para un APK/AAB firmado:

1. Genera un keystore: `keytool -genkey -v -keystore autofinder.jks -alias autofinder -keyalg RSA -keysize 2048 -validity 10000`
2. En Android Studio: *Build → Generate Signed Bundle / APK*.
3. O por línea de comandos tras configurar `android/keystore.properties`:
   `npm run android:apk`

`versionCode` y `versionName` viven en `android/app/build.gradle` — súbelos en cada release.

---

## 3. IPA (iOS)

Requiere macOS con Xcode y CocoaPods. **No se puede generar desde Windows.**

```bash
npm run cap:add:ios
npm run assets
npm run ios                # build + sync + abre Xcode
```

En Xcode: selecciona el *Team* de firma, ajusta *Version*/*Build*, luego
*Product → Archive → Distribute App*.

`Info.plist` hereda el nombre desde `capacitor.config.json`; si necesitas permisos
adicionales (cámara, ubicación) se declaran ahí.

---

## La API y el proxy

El navegador **no** llama a `api.anthropic.com` directamente: el preflight CORS falla y la
clave quedaría embebida en el bundle, legible por cualquiera que descargue la web o
descompile el APK. Todas las peticiones pasan por `server/anthropic-proxy.mjs`, que guarda la
clave del lado del servidor y reenvía la petición incluido el streaming.

- **Endpoint del cliente:** `POST /api/messages`
- **En dev y preview:** lo monta automáticamente el plugin de Vite (`vite.config.js`).
- **En producción web:** despliega el mismo handler como función serverless
  (`createProxyHandler()` es un `(req, res)` estándar de Node) o detrás de Express.
- **En APK/IPA:** una ruta relativa apuntaría al bundle local, así que hay que definir
  `VITE_API_BASE=https://tu-backend` **antes** de compilar.

### Configurar la clave

```bash
cp .env.example .env
# edita .env y pon ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

`.env` está en `.gitignore`. La clave nunca llega al navegador.

### Modo demostración

Sin `ANTHROPIC_API_KEY` el proxy **no falla**: responde con un catálogo de ejemplo en el mismo
formato SSE que la API real, para que la interfaz se pueda ver y probar. La app muestra un
aviso rojo indicando que son datos de ejemplo y no precios reales, y cada vehículo lleva
`_demo: true`. En cuanto añadas la clave y reinicies, las consultas pasan a ser reales.

## Imágenes de los vehículos

Cascada de tres niveles, para que la tarjeta aparezca de inmediato y la foto entre después:

1. `imageUrl` que devuelve el modelo.
2. Mapa local `WIKI_IMAGES` (35+ modelos habituales en Colombia).
3. Búsqueda en la API de Wikimedia Commons (admite CORS, no necesita clave).

Si un nivel falla, el `<img>` pasa solo al siguiente. La búsqueda en Commons exige que el
**nombre del archivo** contenga marca y modelo, y despriorizarán los primeros planos
(interior, motor, tablero…), porque una búsqueda de texto libre devolvía fotos equivocadas
—"Chevrolet Tracker car" traía la foto de una pista de pruebas—. Los resultados se cachean
por modelo durante la sesión. Si nada cumple, se muestra el marcador con el nombre de la
marca, que es preferible a una foto que no corresponde.

---

## Regenerar iconos

Los iconos se derivaron de `LOGO_SRC` (el logo embebido en el JSX), recortando la marca y
recomponiendo su transparencia. Si cambia el logo, reemplaza `resources/icon.png` (1024×1024)
y `resources/splash.png` (2732×2732), luego ejecuta `npm run assets` para lo nativo y
regenera manualmente los PNG de `public/icons/`.
