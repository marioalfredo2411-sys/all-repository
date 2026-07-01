# CONTEXT.md — Metro de Medellín App

Proyecto de mapa interactivo PWA del sistema de transporte integrado Metro de Medellín.
Desarrollado iterativamente en conversación con Claude (Anthropic).

---

## 1. Descripción del proyecto

**Archivo principal:** `metro-medellin.html` (single-file app)
**Tipo:** Progressive Web App (PWA) — HTML/CSS/JS puro, sin frameworks
**Hosting:** Netlify (URL de ejemplo: `https://graceful-profiterole-91908a.netlify.app`)
**Mapa base:** Leaflet.js 1.9.4 + CartoDB Dark tiles (con filtro CSS de brillo/contraste)
**Fuente de datos en tiempo real:** Overpass API (OpenStreetMap)
**Tipografía:** Barlow Condensed + Barlow (Google Fonts)

---

## 2. Stack técnico

| Componente | Tecnología |
|---|---|
| Mapa interactivo | Leaflet.js 1.9.4 |
| Tiles | CartoDB `dark_all` con `filter: brightness(1.9) contrast(1.15)` |
| Datos de vías | Overpass API (OSM) — cargado al inicio |
| Geolocalización | `navigator.geolocation.getCurrentPosition` |
| Persistencia | `localStorage` (correcciones de ubicación) |
| Fuentes | Google Fonts — Barlow / Barlow Condensed |
| Despliegue | Netlify Drop (carpeta arrastrando) |
| PWA | `manifest.json` + `sw.js` (Service Worker) |

---

## 3. Archivos del proyecto

```
metro-medellin/
├── index.html          ← app completa (single file)
├── manifest.json       ← PWA manifest con id, icons, screenshots
├── sw.js               ← Service Worker para offline
├── icon-192.png        ← ícono PWA 192×192
├── icon-512.png        ← ícono PWA 512×512
├── screenshot1.png     ← captura para PWABuilder/stores
└── screenshot2.png     ← captura para PWABuilder/stores
```

---

## 4. Líneas del sistema integrado

Colores extraídos del **mapa oficial físico de SITVA** (foto tomada en estación Estadio).

### Metro (tren urbano)
| Línea | Color | Tramo | Tipo |
|---|---|---|---|
| A | `#1e4fa0` (azul) | Niquía ↔ La Estrella | `metro` |
| B | `#f07830` (naranja) | San Antonio ↔ San Javier | `metro` |

### Metrocable (teleférico)
| Línea | Color | Tramo | Tipo |
|---|---|---|---|
| H | `#c8387a` (rosa/magenta) | Oriente ↔ Villa Sierra | `cable` |
| J | `#c8a020` (dorado) | San Javier ↔ La Aurora | `cable` |
| K | `#5aaa28` (verde lima) | Acevedo ↔ Santo Domingo | `cable` |
| L | `#8a7828` (khaki/oliva) | Santo Domingo ↔ Arví | `cable` |
| M | `#282870` (azul marino) | Miraflores ↔ Trece de Noviembre | `cable` |
| P | `#d01818` (rojo) | Acevedo ↔ El Progreso 🚧 | `cable` |

### Tranvía y Bus Eléctrico
| Línea | Color | Tramo | Tipo |
|---|---|---|---|
| T | `#1e8040` (verde esmeralda) | San Antonio ↔ Oriente | `tranvia` |
| O | `#28b4d0` (cyan) | Caribe ↔ La Palma (Av. 80) | `tranvia` |

### Bus BRT (Metroplús)
| Línea | Color | Tramo | Tipo |
|---|---|---|---|
| 1 | `#287888` (teal oscuro) | U. de M. ↔ Parque Aranjuez (Av. Ferrocarril) | `bus` |
| 2 | `#50c0c0` (teal claro) | U. de M. ↔ Parque Aranjuez (Av. Oriental) | `bus` |

---

## 5. Estaciones por línea

### Línea A (21 estaciones)
Niquía · Bello · Madera · Acevedo · Tricentenario · Caribe · Universidad · Hospital · Prado · Parque Berrío · San Antonio · Alpujarra · Exposiciones · Industriales · Poblado · Aguacatala · Ayurá · Envigado · Itagüí · Sabaneta · La Estrella

### Línea B (7 estaciones)
San Antonio · Cisneros · Suramericana · Estadio · Floresta · Santa Lucía · San Javier

### Línea H (4 estaciones)
Oriente · El Pinal · Las Esperanzas · Villa Sierra

### Línea J (4 estaciones)
San Javier · Juan XXIII · Vallejuelos · La Aurora

### Línea K (4 estaciones)
Acevedo · Andalucía · Popular · Santo Domingo

### Línea L (2 estaciones)
Santo Domingo · Arví

### Línea M (3 estaciones)
Miraflores · El Pinal · Trece de Noviembre

### Línea P (3 estaciones — en construcción)
Acevedo · Doce de Octubre · El Progreso

### Línea T (7 estaciones)
San Antonio · Bicentenario · Buenos Aires · Miraflores · Loyola · Alejandro Echavarría · Oriente

### Línea O (11 estaciones)
Caribe · Córdoba · Pilarica · Ciudadela Universitaria · Facultad de Minas · Los Colores · Calasanz · Integración Floresta · Los Pinos · Santa Lucía · La Palma

### Línea 1 (6 estaciones)
U. de M. · Integración · Chagualo · Ruta N · U. de A. · Universal · Parque Aranjuez

### Línea 2 (11 estaciones)
U. de M. · San José · La Playa · Catedral · Minorista · Berlín · Las Esmeraldas · Manrique · Gardel · Palos Verdes · Parque Aranjuez

---

## 6. Funcionalidades implementadas

### Mapa
- Mapa oscuro interactivo con Leaflet + CartoDB Dark tiles
- Filtro CSS `brightness(1.9) contrast(1.15) saturate(1.3)` sobre las tiles para mayor visibilidad de calles
- Rutas de líneas dibujadas como polilíneas (metro: trazo continuo grueso; cable: punteado; bus: punteado fino)
- Geometría real de vías cargada desde Overpass API al iniciar (con fallback a coordenadas locales)
- Zoom sin botones +/- en pantalla (solo gestos)
- Atribución: `© Metro Medellín · OSM`

### Geolocalización
- Botón "Mi ubicación" en el header
- Muestra punto azul con círculo de precisión en el mapa
- Calcula y muestra la estación más cercana con distancia
- Toast informativo al detectar ubicación

### Panel de estaciones (sidebar)
- Oculto por defecto; se abre con botón "Estaciones" en el header
- Búsqueda en tiempo real por nombre o línea
- Filtros por línea (pills con color oficial)
- Cada ítem muestra: punto de color, nombre, línea, distancia (si hay GPS)
- **Botón "Detalle"** (siempre visible) → abre ficha de la estación
- **Botón 📍** (siempre visible) → vuela el mapa a la estación

### Ficha de estación (info card)
- Aparece desde abajo con animación `slideUp`
- Muestra: nombre, línea (con color), tipo de sistema
- Datos: tramo, horario oficial, tarifa Cívica, política de bicicletas, tipo de estación
- Botón **"Ver en mapa"** → cierra sidebar, vuela al punto con zoom 17
- Botón **"Google Maps"** → abre Google Maps en las coordenadas exactas
- Botón **"¿Ubicación incorrecta?"** → abre panel de corrección

### Corrección de ubicación
- Panel modal con dos modos:
  1. **GPS actual** — toma posición del celular como nueva ubicación
  2. **Tocar el mapa** — modo de selección interactivo; banner amarillo guía al usuario
- Marcador temporal amarillo muestra la posición propuesta
- Al guardar: actualiza el array `STATIONS` en memoria + persiste en `localStorage`
- Las correcciones se cargan automáticamente al iniciar (`loadSavedCorrections()`)

### Leyenda de líneas
- Panel arrastrable (drag con Pointer Events API, sin passive:false)
- Botón ← para colapsar la leyenda fuera de pantalla
- Tab lateral visible cuando está colapsada para volver a abrirla
- Organizada por categorías: Metro / Metrocable / Tranvía y Bus Eléctrico / Bus BRT

---

## 7. Arquitectura de eventos táctiles

### Problema histórico
El uso de `touchmove` + `passive:false` en `window` bloqueaba el scroll del listado de estaciones en móvil (freeze).

### Solución actual
- **Drag de leyenda:** Pointer Events API (`pointerdown/pointermove/pointerup`) — listeners solo activos mientras se arrastra; se eliminan en `pointerup`
- **Lista de estaciones:** Event delegation con `pointerup` en el contenedor `#stations-list`; guard de scroll: ignora si el dedo se movió >8px verticalmente
- **Items de lista:** `touch-action: manipulation` para eliminar el delay de 300ms
- **Botones:** `touch-action: manipulation` en todos los elementos interactivos críticos

---

## 8. Carga de datos OSM (Overpass API)

Al iniciar, la app:
1. Dibuja inmediatamente con coordenadas hardcodeadas (sin espera)
2. Muestra indicador "Cargando datos de OpenStreetMap…"
3. Consulta Overpass con bounding box `(6.08,-75.70,6.38,-75.44)`:
   - Nodos `railway=station/halt` con `subway=yes` o `cable_car=yes`
   - Ways `railway=subway|light_rail|cable_car|tram`
4. Actualiza coordenadas de estaciones por coincidencia de nombre (normalización con NFD)
5. Construye geometría de rutas encadenando segmentos de vías por proximidad
6. Redibuja todo; muestra toast con número de estaciones actualizadas
7. En caso de error de red: continúa con datos locales sin romper la app

---

## 9. PWA — Instalación

### Android (vía PWABuilder)
1. Subir carpeta a Netlify Drop → obtener URL pública
2. Ir a [pwabuilder.com](https://pwabuilder.com) → pegar URL → Generate Package → Android
3. Descargar ZIP → extraer APK → transferir al celular → instalar habilitando "fuentes desconocidas"

**Error conocido:** PWABuilder puede dar timeout `"Timed out waiting for Google Play packaging job"`. Solución: reintentar, o usar Bubblewrap CLI:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://tu-url.netlify.app/manifest.json
bubblewrap build
```

### iOS
No permite sideloading. Opciones:
- **PWA vía Safari:** Abrir URL → Compartir → "Añadir a pantalla de inicio" (experiencia idéntica a app nativa para este caso de uso)
- **App Store:** Requiere cuenta Apple Developer ($99/año) + Mac con Xcode

### Advertencias resueltas en PWABuilder
- `id` agregado al manifest (`"id": "/"`)
- `screenshots` agregados al manifest (2 imágenes narrow 390×844)

---

## 10. Tarifas oficiales (2026)

Fuente: [metrodemedellin.gov.co/usuarios](https://www.metrodemedellin.gov.co/usuarios)

| Tipo de usuario | Integraciones 1–4 | Integraciones 5–7 |
|---|---|---|
| Frecuente | $3.820 | $4.570 |
| Adulto mayor | $3.330 | $4.080 |
| Estudiantil | $1.600 | $2.350 |
| PcD | $2.720 | $3.470 |
| Al portador / Eventual | $4.400 | $5.150 |

**Cable Arví (Línea L):**
- Estratos 1-2-3 del AMVA: $3.900
- Nacionales / Cívica personalizada: $11.900
- Extranjeros / Al portador: $26.700

---

## 11. Horarios oficiales

| Día | Líneas A B T O 1 2 | Cable K | Cable H J M P |
|---|---|---|---|
| Lun–Sáb | 4:30am – 11:00pm | 4:30am – 11:00pm | 4:30am – 11:00pm |
| Dom/Fest | 5:00am – 10:00pm | 8:30am – 10:00pm | 9:00am – 10:00pm |

**Línea L (Arví):** Lun/Mié–Sáb 9:00am–6:00pm · Dom/Fest 8:30am–6:00pm · **No opera martes**

---

## 12. Historial de bugs resueltos

| Bug | Causa | Solución |
|---|---|---|
| Touch freeze en lista | `touchmove` passive:false en window siempre activo | Pointer Events, listeners solo durante drag |
| Ficha no aparece al tocar lista | `selectStation` hacía string lookup que fallaba con tildes | Delegation llama `showInfoCard(s)` directo con objeto |
| Doble botón en leyenda | `<div id="legend">` duplicado anidado por str_replace fallido | Limpieza del HTML duplicado |
| Touch cancelado al hacer scroll | Sin guard de desplazamiento | Guard: ignora `pointerup` si `deltaY > 8px` |
| Zoom freezeado en mapa | Botones +/- de Leaflet en pantalla | Removidos (`zoomControl: false`) |

---

## 13. Decisiones de diseño

- **Single HTML file:** Todo en un archivo para máxima portabilidad y facilidad de despliegue en Netlify Drop
- **Sin frameworks:** Vanilla JS/CSS — menor peso, sin dependencias que romper
- **Dark theme:** Coordina con el mapa oscuro CartoDB; variables CSS en `:root`
- **Colores oficiales:** Extraídos del mapa físico SITVA del Metro de Medellín (foto tomada en estación)
- **Pointer Events sobre Touch Events:** Unifica mouse, touch y stylus sin passive:false
- **Fallback de datos:** App siempre funcional aunque Overpass falle (coordenadas hardcodeadas verificadas)
- **localStorage para correcciones:** Persiste sin backend; el usuario es el curador de su propia data

---

## 14. Fuentes de referencia usadas

- [metrodemedellin.gov.co/usuarios](https://www.metrodemedellin.gov.co/usuarios) — tarifas, horarios
- [metrodemedellin.gov.co/usuarios/sistema-integrado](https://www.metrodemedellin.gov.co/usuarios/sistema-integrado) — líneas y estaciones
- [metrodemedellin.gov.co/en/users/integrated-system/line-b](https://www.metrodemedellin.gov.co/en/users/integrated-system/line-b) — direcciones exactas estaciones Línea B
- Mapa físico oficial SITVA (foto en estación Estadio) — colores exactos por línea
- [overpass-api.de](https://overpass-api.de) — geometría de vías en tiempo real
- [pwabuilder.com](https://pwabuilder.com) — generación de APK Android
