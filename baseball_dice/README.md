# Baseball Dice ⚾🎲

Juego de béisbol con dados. Un solo archivo HTML (`baseball-dice.html` / `index.html`)
que ahora está preparado para distribuirse como **PWA**, **APK** (Android) e **IPA** (iOS).

---

## 1. Estructura añadida

```
baseball_dice/
├─ index.html               ← copia de baseball-dice.html (punto de entrada estándar)
├─ baseball-dice.html        ← juego + etiquetas PWA + registro del Service Worker
├─ manifest.webmanifest      ← manifiesto PWA completo
├─ sw.js                     ← Service Worker (offline / app shell)
├─ favicon.ico
├─ icons/                    ← iconos PNG (16 … 1024), maskable, apple-touch, screenshot
│  ├─ icon.svg               ← icono vectorial fuente (pelota de baseball + dado)
│  ├─ icon-192.png / icon-512.png
│  ├─ icon-maskable-192.png / icon-maskable-512.png
│  ├─ apple-touch-icon.png   (180×180)
│  └─ screenshot-portrait.png
├─ capacitor.config.json     ← configuración para generar Android/iOS
├─ package.json              ← scripts de build
└─ scripts/
   ├─ generate-icons.ps1     ← regenera todos los iconos (GDI+, sin dependencias)
   └─ build-www.js           ← copia el sitio a ./www para Capacitor
```

> Si cambias el diseño del icono, edita `icons/icon.svg` y/o
> `scripts/generate-icons.ps1` y ejecuta `npm run icons`.

---

## 2. PWA (instalable desde el navegador)

Ya está todo listo. Solo necesita servirse por **HTTPS** (o `localhost`).

```bash
# servidor local rápido
npm run serve        # -> http://localhost:5000
```

- `manifest.webmanifest` está enlazado en el `<head>`.
- `sw.js` se registra al cargar y cachea el "app shell" para que el modo
  **Solo / vs CPU funcione sin conexión** (el multijugador necesita red).
- `theme_color`, `background_color`, iconos `any` + `maskable`, `display: standalone`
  y `orientation: portrait` ya están configurados.

### Publicar
Cualquier hosting estático sirve: **GitHub Pages**, Netlify, Vercel, Cloudflare Pages…

GitHub Pages:
1. Sube la carpeta a la rama `main`.
2. Settings → Pages → Source: `main` / `/root`.
3. La app queda en `https://<usuario>.github.io/<repo>/`.

> Si la publicas en un subdirectorio, las rutas ya son **relativas** (`./`), así que funciona sin cambios.

### Verificar
Chrome DevTools → **Lighthouse** → categoría *PWA*, o **Application → Manifest / Service Workers**.

---

## 3. APK (Android)

Tienes **tres** caminos. El recomendado es **Capacitor** (control total, sirve también para iOS).

### Opción A — Capacitor  ✅ recomendado

Requisitos: Node 18+, Android Studio (con SDK + JDK 17).

```bash
npm install
npm run build            # genera ./www
npx cap add android      # crea el proyecto ./android (solo la 1ª vez)
npm run open:android     # compila www -> sync -> abre Android Studio
```

En Android Studio: **Build → Generate Signed Bundle / APK → APK**.
O por línea de comandos:

```bash
npm run build && npx cap sync
cd android
./gradlew assembleDebug      # APK de prueba -> android/app/build/outputs/apk/debug/
./gradlew assembleRelease    # APK de publicación (requiere firma)
```

Datos de la app (edítalos en `capacitor.config.json` antes de `cap add`):
- `appId`: `com.jennypower.baseballdice`
- `appName`: `Baseball Dice`

Iconos nativos: copia los PNG de `icons/` a `android/app/src/main/res/mipmap-*`
o usa el plugin `@capacitor/assets`:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#1a3a22" --iconBackgroundColorDark "#0f2014"
```

### Opción B — TWA con Bubblewrap (envuelve la PWA publicada)

Requiere la PWA ya online por HTTPS.

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU-DOMINIO/manifest.webmanifest
bubblewrap build          # genera app-release-signed.apk + .aab
```

### Opción C — PWABuilder (sin instalar nada)

1. Entra en https://www.pwabuilder.com
2. Pega la URL de tu PWA publicada.
3. Descarga el paquete **Android** (APK/AAB listo para Google Play).

---

## 4. IPA (iOS)

Requiere **macOS + Xcode** (Apple no permite compilar IPA en Windows/Linux).

### Opción A — Capacitor  ✅ recomendado

```bash
npm install
npm run build
npx cap add ios          # crea ./ios (solo la 1ª vez)
npm run open:ios         # abre Xcode
```

En Xcode:
1. Selecciona el *target* → **Signing & Capabilities** → tu *Team* de Apple Developer.
2. Ajusta *Bundle Identifier* (`com.jennypower.baseballdice`).
3. **Product → Archive** → **Distribute App** → genera el `.ipa` (Ad Hoc, App Store o Development).

Iconos: `npx capacitor-assets generate` (ver arriba) o arrastra `icon-1024.png`
al *Asset Catalog* (`AppIcon`) en Xcode.

### Opción B — PWABuilder

En https://www.pwabuilder.com descarga el paquete **iOS**; te da un proyecto Xcode
que igualmente hay que *archivar* y firmar en un Mac.

---

## 5. Versiones

### v1.4.0 — salir de la partida / abandono
- Botón **✕ SALIR** en la barra de dados durante el juego y **← SALIR DE LA SALA** en el lobby.
- Pide confirmación (overlay propio, funciona en PWA instalada).
- **Multijugador**: si un jugador sale con la partida en curso, se marca `gs.forfeit`
  + `gs.gameOver` y se difunde; el rival recibe el estado y ve *"X GANA · Y abandonó la partida"*.
- **Solo**: solo confirma y vuelve al inicio.
- Guardas `if(!gs)` en las cadenas async (roll / CPU / processResult) para no romper si
  el usuario sale a mitad de una animación.
- `sw.js` → caché `v1.4.0`.

### v1.3.0 — cancha más pequeña + semáforo reubicado
- La cancha ahora se dibuja con **contain-fit** (recorte `FIELD_CROP` del PNG) para que
  se vean **las 4 bases completas** en pantallas verticales, con sombra que la separa del fondo.
- El `r` de referencia del HUD se acota para que el marcador siga legible con la cancha pequeña.
- El tag de turno y el registro de jugadas se anclan **justo debajo de la cancha**.
- El panel de OUTS del campo se elimina (su info ya está en el semáforo).
- El **semáforo B/S/O baja** a la esquina inferior derecha, fuera de la cancha; dígitos en Oswald bold.
- `sw.js` → caché `v1.3.0`.

### v1.2.0 — pizarra de entradas + semáforo B/S/O
- **Pizarra (line score)**: al terminar cada media entrada (3 outs / cambio de lado)
  aparece una pizarra estilo béisbol con las carreras por entrada de cada equipo,
  totales **C** (carreras) y **H** (hits), y un marcador `▸` del equipo que batea.
  Se cierra sola a los ~4.6 s o al tocar. También se muestra en la pantalla final.
  Título dinámico: *FIN 1ª ALTA*, *FIN 1ª BAJA*, …
- **Semáforo B/S/O**: indicador tipo semáforo (lámparas B amarilla · S verde · O roja)
  fijo durante el juego, con el conteo de la media entrada en curso. **Se reinicia a
  0/0/0 en cada cambio de equipo.** B = bases por bolas, S = ponches, O = outs.
- Estado nuevo en `gs`: `balls`, `strikes`, `line{away,home}`, `hits{away,home}`.
  Compatible con partidas/estados anteriores (se rellenan por defecto).
- `sw.js` → caché `v1.2.0`.

### v1.1.0 — responsive
- Todo el juego se envuelve en un **`#stage`** (retrato, `max-width: 480px`) que se
  centra en pantallas grandes con panel redondeado y sombra; en móvil ocupa el 100 %.
- Canvas y pantallas pasan de `position: fixed` (viewport) a `position: absolute`
  (relativo al escenario); el render usa el tamaño del escenario, no `window.innerWidth`.
- Formularios (Home / Solo / Lobby) con **scroll interno** (`justify-content: safe center`)
  para no recortarse en horizontal o en pantallas bajas.
- Soporte de **notch** con `env(safe-area-inset-*)` y altura `100dvh`.
- Recalculo de layout con `ResizeObserver` + `visualViewport` además de `resize`.
- `sw.js` → caché `v1.1.0` (sube `VERSION` en cada publicación para invalidar la anterior).

## 6. Notas

- **Offline**: el `sw.js` usa *stale-while-revalidate* + precache. Al publicar una
  versión nueva, sube el número en `const VERSION` de `sw.js` para invalidar la caché.
- **Multijugador**: usa `jsonstore.io`; el Service Worker nunca cachea ese dominio.
- **`www/`, `android/`, `ios/`** están en `.gitignore` porque se regeneran. Si añades
  código nativo propio, quítalos del `.gitignore` y haz commit.
- **Fuentes**: se cargan de Google Fonts; en la 1ª carga online quedan cacheadas para uso offline.
```
