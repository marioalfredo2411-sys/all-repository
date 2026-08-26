# Metro Medellín — apps nativas iOS / Android

Mapa interactivo del sistema integrado del Metro de Medellín.
El código de la app sigue siendo `index.html` (un solo archivo, vanilla JS + Leaflet).
[Capacitor](https://capacitorjs.com) lo envuelve en proyectos nativos de Android y iOS
sin duplicar el código.

Ver [CONTEXT.md](CONTEXT.md) para la descripción funcional de la app.

---

## Estructura

```
metro_medellin/
├── index.html              ← LA APP (el bloque de datos se genera, ver data/)
├── manifest.json  sw.js    ← PWA (despliegue en Netlify)
├── icons/                  ← íconos y splash de la PWA (generados)
│
├── data/                   ← BASE DE DATOS del sistema. Ver data/README.md
│   ├── lines.json          ← líneas + estaciones en orden de recorrido
│   ├── stations.json       ← 70 estaciones físicas + servicios
│   ├── services.json       ← catálogo de 31 servicios
│   └── fares.json          ← tarifas vigentes
│
├── src/
│   ├── native.js           ← capa Capacitor (GPS, enlaces, splash, botón atrás)
│   └── native.css          ← ajustes visuales solo del build nativo
├── scripts/
│   ├── lib/db.mjs          ← carga y campos derivados de la base de datos
│   ├── build-data.mjs      ← data/*.json → bloque generado en index.html
│   ├── validate-data.mjs   ← integridad referencial de los datos
│   ├── data-report.mjs     ← qué falta por documentar
│   ├── build-www.mjs       ← index.html → www/ adaptado a nativo
│   ├── make-assets.mjs     ← icon-512.png → assets/ (íconos y splash fuente)
│   └── serve.mjs           ← servidor local para probar la PWA
│
├── assets/                 ← imágenes fuente para @capacitor/assets (generadas)
├── www/                    ← build web que empaqueta Capacitor (generado, gitignored)
├── android/                ← proyecto Android Studio / Gradle
└── ios/                    ← proyecto Xcode
```

**Regla de oro:** nunca editar `www/`, `android/app/src/main/assets/public/` ni
`ios/App/App/public/`. Se sobrescriben en cada `npm run sync`.

Tampoco el bloque entre `/* DB:START */` y `/* DB:END */` de `index.html`: lo
genera `npm run data:build` desde `data/`. Todo lo demás de `index.html` sí se
edita a mano.

---

## Flujo de trabajo

```bash
npm install          # una sola vez
npm run serve        # probar en el navegador → http://localhost:5173
npm run sync         # regenerar www/ y copiarlo a android/ e ios/
```

Cada vez que cambies `index.html`, `src/native.js` o `src/native.css`, corre
`npm run sync` antes de compilar.

| Comando | Qué hace |
|---|---|
| `npm run data:check` | Valida `data/*.json` sin tocar nada |
| `npm run data:build` | Valida e inyecta los datos en `index.html` |
| `npm run data:report` | Cobertura: qué estaciones faltan por documentar |
| `npm run build` | `data:build` + genera `www/` |
| `npm run sync` | `build` + copia a las plataformas nativas |
| `npm run assets` | Regenera todos los íconos y splash desde `icon-512.png` |
| `npm run android:open` | Abre el proyecto en Android Studio |
| `npm run android:run` | Compila e instala en un dispositivo/emulador conectado |
| `npm run android:apk` | APK de debug → `android/app/build/outputs/apk/debug/` |
| `npm run android:bundle` | AAB de release para Google Play |
| `npm run ios:open` | Abre el proyecto en Xcode (solo macOS) |

---

## Base de datos

`data/` es la fuente de verdad de líneas, estaciones, servicios y tarifas.
`npm run data:build` la valida y la inyecta en `index.html`, así que la app
sigue siendo un archivo autónomo y offline. Guía completa en
**[data/README.md](data/README.md)**.

Lo esencial:

- **Una estación física = un registro.** San Antonio aparece una vez, no tres.
  Qué líneas la sirven sale de `lines.json`; `transbordo` se calcula solo.
- **Tres estados por servicio:** `true` (lo tiene), `false` (no lo tiene),
  ausente (**no verificado**). La app solo muestra lo confirmado — nunca afirma
  que una estación tiene ascensor sin fuente.
- **Los servicios por estación están vacíos** (0/70). No se podían deducir de
  los datos que ya tenía el proyecto; hay que verificarlos. `npm run data:report`
  dice qué falta.
- Las tarifas y horarios que ve el usuario se arman desde `fares.json` y
  `lines.json`: subirlas de precio es editar un archivo, no buscar strings.

### Supabase

`supabase/` tiene el mismo modelo en PostgreSQL, como backend de **edición**
(Studio de panel de administración) — no como origen en tiempo de ejecución: la
app tiene que arrancar sin red. Guía en **[supabase/README.md](supabase/README.md)**.

```
Supabase  ──db:pull──▶  data/*.json  ──data:build──▶  index.html  ──sync──▶  apps
    ▲                        │
    └────────db:push─────────┘
```

`npm run db:test` levanta un PostgreSQL real en WebAssembly (PGlite), aplica
migraciones y seed y verifica restricciones, triggers, RLS y exportación. No
necesita Docker ni conexión.

---

## Android

### Requisitos

Este equipo **no tiene ninguno instalado todavía**; hacen falta:

1. **JDK 21** — viene incluido en Android Studio (`jbr/`), o [Temurin 21](https://adoptium.net/).
2. **[Android Studio](https://developer.android.com/studio)** — instala también el SDK.
3. En Android Studio → *SDK Manager*: Android SDK Platform **35** y *Android SDK Build-Tools*.
4. Crear `android/local.properties` con la ruta del SDK (Android Studio lo hace solo
   al abrir el proyecto la primera vez):
   ```properties
   sdk.dir=C\:\\Users\\mario\\AppData\\Local\\Android\\Sdk
   ```

### Compilar

```bash
npm run android:open     # abrir en Android Studio y darle a ▶
# o, desde la terminal:
npm run android:apk      # → android/app/build/outputs/apk/debug/app-debug.apk
```

Para instalar el APK de debug en el teléfono: transferirlo y habilitar
"instalar de fuentes desconocidas". Ya no hace falta PWABuilder ni Bubblewrap.

### Firmar la app para Google Play

1. Generar el keystore **una sola vez** y guardarlo bien: sin él Google Play no
   acepta actualizaciones de la app, nunca.
   ```bash
   keytool -genkey -v -keystore android/metromed-release.jks \
           -keyalg RSA -keysize 2048 -validity 10000 -alias metromed
   ```
2. Copiar `android/keystore.properties.example` a `android/keystore.properties`
   y rellenar las contraseñas.
3. `npm run android:bundle` → `android/app/build/outputs/bundle/release/app-release.aab`

Tanto `*.jks` como `keystore.properties` están en `.gitignore`.

### Subir de versión

En `android/app/build.gradle`: `versionCode` (entero, +1 en cada subida a Play)
y `versionName` (el que ve el usuario, p. ej. `"1.1"`).

---

## iOS

**Requiere un Mac.** No hay forma de compilar una app de iOS desde Windows: la
cadena de compilación (Xcode, `xcodebuild`, CocoaPods, firma) es solo de macOS.
Por eso `npx cap add ios` avisó *"Skipping pod install"* — el proyecto Xcode ya
está creado y completo, pero las dependencias nativas se instalan en el Mac.

### En el Mac

Llevar el proyecto al Mac (sin `node_modules/`, `www/` ni `ios/App/Pods/`; lo
más cómodo es `git init` + subirlo a un repositorio, ya que `.gitignore` está
configurado para excluir justo eso). Una vez allí:

```bash
cd metro_medellin
npm install
sudo gem install cocoapods     # si no está
npm run sync                   # ahora sí ejecuta pod install
npm run ios:open               # abre ios/App/App.xcworkspace en Xcode
```

En Xcode → target *App* → *Signing & Capabilities*: elegir tu equipo de
desarrollo. Con una cuenta gratuita de Apple ID puedes instalarla en tu propio
iPhone, pero la firma caduca a los **7 días** y hay que reinstalar.

### Publicar en la App Store

Requiere **Apple Developer Program, 99 USD/año**. Luego: *Product → Archive →
Distribute App*.

### Alternativa sin Mac: PWA

Sigue disponible y es la vía más rápida. En Safari (iOS): abrir la URL de
Netlify → *Compartir* → *Añadir a pantalla de inicio*. Ya quedó configurada con
`apple-touch-icon`, pantallas de arranque para cada tamaño de iPhone/iPad y
soporte de notch, así que se ve igual que la app nativa.

---

## Qué añade la capa nativa (`src/native.js`)

| Función | Por qué hace falta |
|---|---|
| `navigator.geolocation` → plugin nativo | El WebView de Android **no pide** el permiso de ubicación por su cuenta: sin esto el botón "Mi ubicación" falla siempre |
| `window.open` → intent `geo:` / navegador in-app | `window.open` no hace nada dentro de un WebView; el botón "Google Maps" quedaría muerto |
| Ocultar la splash al pintar el primer tile | Evita ver un lienzo en blanco mientras Leaflet arranca |
| Botón atrás de Android | Cierra ficha → panel → sidebar; doble toque para salir |
| Aviso de "sin conexión" | Los tiles y Overpass son remotos; sin red la app se veía vacía y sin explicación |
| Status bar oscura | Coherencia con el tema de la app |

El archivo comprueba `Capacitor.isNativePlatform()` y **no hace nada en el
navegador**, así que la PWA no se ve afectada.

---

## Permisos declarados

**Android** (`android/app/src/main/AndroidManifest.xml`): `INTERNET`,
`ACCESS_NETWORK_STATE`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`.
El GPS se declara `required="false"` para no excluir dispositivos sin él.

**iOS** (`ios/App/App/Info.plist`): `NSLocationWhenInUseUsageDescription`.
App Review rechaza el binario si ese texto falta o no explica el uso concreto.

---

## Antes de publicar en las tiendas

Dos cosas quedaron con valores por defecto **a propósito**, porque son decisiones
tuyas y afectan cómo te identificas ante Apple y Google:

1. **Identificador de la app.** Ahora es `com.metromed.mapa`. Conviene cambiarlo
   por un dominio inverso que controles tú (`com.tuapellido.metromed`). Se cambia
   con `npx cap init` o editando `capacitor.config.json`, `android/app/build.gradle`
   (`namespace` y `applicationId`) y el bundle ID en Xcode. **Una vez publicada la
   app, el identificador no se puede cambiar nunca más.**

2. **Nombre y marca.** "Metro Medellín" y el logo tipo "M" pueden confundirse con
   la app oficial del Metro de Medellín, que es una entidad pública real. Tanto
   App Store como Google Play rechazan apps que aparenten ser de una organización
   con la que no tienes relación. Antes de enviarla conviene:
   - un nombre que deje claro que no es oficial (p. ej. *"Mapa MetroMed (no oficial)"*),
   - indicarlo también en la descripción de la ficha,
   - o pedir autorización al Metro de Medellín para usar su marca.

   Para uso personal o compartir el APK con conocidos esto no aplica.

Además, las tiendas piden una **política de privacidad** con URL pública en
cuanto la app pide ubicación, aunque el dato no salga del dispositivo (aquí no
sale: solo se usa en memoria y las correcciones van a `localStorage`).
