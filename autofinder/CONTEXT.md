# AutoFinder CO — Contexto del Proyecto

> Documento de contexto completo: historial de conversación, decisiones de diseño, arquitectura técnica y estado actual del proyecto.

---

## 1. Descripción General

**AutoFinder CO** es una aplicación web progresiva (React SPA) para comparar vehículos en el mercado colombiano. Permite al usuario buscar, filtrar, comparar y guardar vehículos con precios en COP obtenidos en tiempo real mediante IA.

- **Archivo principal:** `vehicle-comparator.jsx` (~2000 líneas, componente React único auto-contenido)
- **Stack:** React 18 + CSS-in-JSX + Anthropic API
- **Despliegue:** Artifact de Claude.ai (renderizado como componente JSX)
- **Idioma de UI:** Español (Colombia)

---

## 2. Historial de Iteraciones

### Iteración 1 — MVP inicial
**Objetivo:** Aplicación base con búsqueda de vehículos via IA + web search.

**Lo que se construyó:**
- Grid de tarjetas de vehículos con foto, descripción, especificaciones y precio en COP
- Sidebar de filtros: ubicación (campo de texto libre), categoría, condición, rango de precio
- Comparador de hasta 3 vehículos con tabla lado a lado
- Barra flotante de comparación en la parte inferior
- Estados de carga, error y vacío
- Llamada a `claude-sonnet` con `web_search` tool para obtener datos reales

**Estética:** Tema oscuro tipo showroom automotriz. Fuentes: Barlow Condensed (títulos) + Barlow (cuerpo). Colores: fondo `#080b12`, acento rojo `#e63946`, acento cyan `#22d3ee`.

---

### Iteración 2 — Filtros adicionales: marca, transmisión y ciudad
**Cambios aplicados:**
- **Ciudad como combobox** (reemplazó el campo de texto libre): 27 ciudades colombianas incluyendo todas las capitales departamentales. Valor predeterminado: Medellín.
- **Filtro de marca:** Select con 34+ marcas presentes en Colombia (Chevrolet, Renault, Kia, Hyundai, Toyota, Ford, BMW, Mercedes-Benz, BYD, JAC, Haval, etc.)
- **Filtro de transmisión:** Chips seleccionables cubriendo todos los tipos: Automática, Mecánica, Secuencial, CVT (Variador Continuo), Doble Embrague (DCT/DSG), Automatizada (AMT), Semi-automática
- El prompt enviado a la IA se actualizó para incluir marca y transmisión como parámetros de búsqueda
- `useCallback` actualizado con las nuevas dependencias

---

### Iteración 3 — Logo oficial + filtro de año
**Cambios aplicados:**
- **Logo oficial:** Se incrustó la imagen `Logo-AF-long.png` como base64 directamente en el componente, reemplazando el texto "AutoFinder CO" en el header. Altura 38px, `object-fit: contain`.
- **Filtro de año:** Select desplegable con rangos predefinidos (año actual, año anterior, rango de 3 años, rangos históricos 2019-2021, 2015-2018, etc.)
- Limpieza de constantes duplicadas de año que quedaron de versiones anteriores

**Constante generada:** `LOGO_SRC` con data URI base64 de la imagen PNG.

---

### Iteración 4 — Funcionalidades avanzadas
**Cambios aplicados:**

#### Ficha de detalle
- Modal expandido al hacer clic en cualquier tarjeta
- Foto grande (260px), precio destacado, badge de condición
- Grilla de especificaciones en 2 columnas: motor, transmisión, combustible, potencia, asientos, tracción, puertas, kilometraje
- Enlace directo al distribuidor
- Botón de guardar en favoritos

#### Sistema de Favoritos
- Estado `favorites` inicializado desde `localStorage` (clave: `af_favorites`)
- `toggleFav()` persiste cambios en localStorage automáticamente
- Función `favKey()` como identificador único `brand-model-year`
- Botón ❤️/🤍 en cada tarjeta (con `stopPropagation` para no abrir el detalle)

#### Tabs Búsqueda / Favoritos
- Tab "Búsqueda" con contador de resultados
- Tab "Favoritos" con contador y opción "Limpiar todo"
- Estado `activeTab`: `"search"` | `"favorites"`

#### Skeleton Loading
- Componente `SkeletonCard` con animación `skPulse`
- Durante la carga: tarjetas reales ya recibidas + skeletons de relleno hasta completar 8

#### Pills de filtros activos
- Array `activeFilters` derivado del estado actual
- Pills removibles individualmente sobre el grid
- Botón "✕ Limpiar X filtros" en sidebar

#### Reset general de filtros
- Función `resetFilters()` que vuelve todos los filtros a sus valores por defecto

#### Botón Reintentar
- Aparece en el mensaje de error para relanzar la búsqueda

---

### Iteración 5 — Streaming progresivo + imágenes reales
**Cambios aplicados:**

#### Streaming NDJSON
- API llamada con `stream: true`
- Lectura chunk a chunk con `ReadableStream` + `TextDecoder`
- Cada vehículo se emite en su propia línea JSON (formato NDJSON)
- `tryParseNewVehicles()` extrae objetos JSON completos del buffer acumulado
- Las tarjetas aparecen en pantalla en 2-4 segundos (primer resultado)
- Deduplicación por `brand + model + year`
- Fallback: si NDJSON falla, intenta parsear JSON array clásico

#### VehicleImage con fallback automático
- Componente `VehicleImage` con cascada de 3 niveles:
  1. URL de la IA
  2. Fallback a `WIKI_IMAGES` (mapa de 35+ URLs de Wikimedia Commons)
  3. Placeholder con ícono SVG y nombre de marca
- `getWikiFallback(brand, model)` busca por clave exacta o parcial
- `loading="lazy"` en todas las imágenes

#### WIKI_IMAGES (mapa de imágenes de respaldo)
Cubre los modelos más comunes en Colombia: Tracker, Onix, Duster, Sandero, Logan, Sportage, Picanto, Rio, Sorento, Tucson, Creta, Corolla, Hilux, Fortuner, Prado, CX-5, Mazda3, Polo, Tiguan, Explorer, Ranger, Kicks, Frontier, HR-V, X3, GLE, Compass, Wrangler, BYD Atto 3, BYD Dolphin, Jimny, Outlander, Haval H6.

#### Indicador de stream activo
- `stream-bar` con punto pulsante (`stream-dot`)
- Mensaje cambia de "Consultando…" a "Encontrando más… X hasta ahora" al llegar resultados

---

### Iteración 6 — Filtro de año rediseñado + cancelación + shimmer de imágenes
**Cambios aplicados:**

#### Filtro de año rediseñado (3 modos)
- **Cualquiera:** Sin filtro de año
- **Año exacto:** Select de 1990 al año actual
- **Rango:** Dos selects + dos inputs numéricos sincronizados
- Estado: `yearMode` ("any" | "select" | "range"), `yearFrom`, `yearTo`
- `YEAR_OPTIONS`: array generado dinámicamente `[añoActual, ..., 1990]`
- `resolvedYear` calculado en el momento de búsqueda para el prompt

#### Cancelación de búsqueda
- `AbortController` en `useRef` (`abortRef`)
- `cancelSearch()`: aborta el request y limpia el estado
- Nueva búsqueda cancela automáticamente la anterior
- `signal: controller.signal` inyectado en el `fetch`
- `catch` ignora `AbortError` (no muestra error al cancelar)
- Botón rojo "✕ Cancelar búsqueda" visible solo durante la carga

#### Shimmer de imagen en carga
- `VehicleImage` refactorizado: estado `loaded` y `stage`
- Mientras carga: shimmer animado (barrido de luz) + ícono SVG + texto "Cargando imagen…"
- Al cargar: `img-fade-in` (fade + scale suave)
- La tarjeta con info del vehículo ya es visible mientras la imagen carga

---

### Iteración 7 — Velocidad de carga optimizada
**Problema:** La API tardaba 20-40 segundos porque `web_search` hacía múltiples búsquedas secuenciales antes del primer resultado.

**Solución — Arquitectura de dos fases:**

#### Fase 1: Respuesta instantánea (2-5 segundos)
- Modelo cambiado a `claude-haiku-4-5-20251001` (3-5x más rápido que Sonnet)
- **Sin tool `web_search`** en la llamada principal
- El modelo responde desde su conocimiento del mercado colombiano 2024-2025
- Primer resultado visible en 2-4 segundos; 10 resultados completos en 5-8 segundos

#### Fase 2: Verificación de precios en background (no bloqueante)
- Fire-and-forget asíncrono después de que los resultados están en pantalla
- Usa `claude-haiku` + `web_search` para verificar precios de las 5 primeras marcas
- Actualiza `price`, `priceFormatted` y `source` en las tarjetas silenciosamente
- Marca vehículos verificados con `_priceVerified: true`

#### Badge "✓ Verificado"
- CSS: `.price-verified-badge` con borde y color cyan (`--accent2`)
- Aparece en el label de precio de tarjetas verificadas
- Animación fadeIn al actualizarse

#### Header actualizado
- Badge cambiado de "IA + Web" a "⚡ Rápido"
- Subtítulo: "Resultados instantáneos · Precios verificados"

#### Disclaimer actualizado
- Explica que los marcados con "✓ Verificado" fueron confirmados en tiempo real

---

## 3. Arquitectura del componente

```
vehicle-comparator.jsx
├── Imports: React, { useState, useCallback, useEffect, useRef }
├── LOGO_SRC (base64 PNG incrustado)
├── Constantes de filtros
│   ├── BRANDS[] — 34+ marcas
│   ├── YEAR_OPTIONS[] — [añoActual, ..., 1990]
│   ├── TRANSMISSIONS[] — 7 tipos
│   ├── CATEGORIES[] — 9 categorías
│   ├── CONDITIONS[] — Nuevo / Semi-nuevo / Usado
│   ├── PRICE_RANGES[] — 6 rangos en COP
│   └── CITIES[] — 27 ciudades colombianas
├── WIKI_IMAGES{} — 35+ URLs Wikimedia Commons
├── getWikiFallback(brand, model)
├── Helpers: fmt(), condColor{}
├── GlobalStyles (CSS-in-JSX completo)
├── VehicleImage — imagen con shimmer + fallback automático
├── SkeletonCard — tarjeta animada de carga
├── DetailModal — modal de ficha completa
├── VehicleCard — tarjeta individual del grid
├── CompareModal — tabla comparativa lado a lado
└── VehicleComparator (default export)
    ├── Estados de filtros
    │   ├── location, category, condition, brand, transmission
    │   ├── yearMode, yearFrom, yearTo, yearFilter
    │   └── priceIdx, sortBy
    ├── Estados de UI
    │   ├── vehicles[], loading, error, searched
    │   ├── compareList[], showCompare
    │   ├── favorites[], detailVehicle
    │   └── activeTab ("search"|"favorites")
    ├── abortRef (useRef)
    ├── cancelSearch()
    ├── searchVehicles() — streaming NDJSON + background refresh
    ├── toggleCompare()
    ├── toggleFav() — con localStorage
    ├── resetFilters()
    ├── activeFilters[] — pills derivados del estado
    ├── sorted[] — vehículos ordenados
    └── JSX
        ├── Header (logo + badge)
        ├── Sidebar (filtros + botones)
        ├── Main
        │   ├── Tab bar
        │   ├── Tab búsqueda
        │   │   ├── Stream bar
        │   │   ├── Active filter pills
        │   │   ├── Results header + sort
        │   │   ├── Grid (VehicleCard + SkeletonCard)
        │   │   └── Disclaimer
        │   └── Tab favoritos
        ├── Compare bar (barra flotante)
        ├── CompareModal
        └── DetailModal
```

---

## 4. API Calls

### Llamada principal (búsqueda rápida)
```
POST https://api.anthropic.com/v1/messages
Modelo:   claude-haiku-4-5-20251001
Stream:   true
Tools:    ninguna
Max tok:  8000
Sistema:  Base de datos automotriz colombiana, responde NDJSON
Prompt:   Filtros seleccionados → 10 vehículos, 1 JSON por línea
```

### Llamada de verificación en background
```
POST https://api.anthropic.com/v1/messages
Modelo:   claude-haiku-4-5-20251001
Stream:   false
Tools:    web_search_20250305
Max tok:  3000
Sistema:  Busca precios reales COP, devuelve JSON de actualizaciones
Propósito: Verificar precios de las primeras 5 marcas mostradas
```

---

## 5. Formato de datos de vehículo

```json
{
  "brand": "Chevrolet",
  "model": "Tracker",
  "version": "Premier Turbo",
  "year": 2024,
  "category": "SUV",
  "condition": "Nuevo",
  "price": 119900000,
  "currency": "COP",
  "priceFormatted": "$119.900.000",
  "description": "SUV compacto con motor turbo 1.2L...",
  "keySpecs": {
    "engine": "1.2 Turbo 133 HP",
    "transmission": "CVT (Variador Continuo)",
    "fuelType": "Gasolina",
    "seats": 5,
    "power": "133 HP",
    "traction": "FWD",
    "doors": 5
  },
  "imageUrl": "https://upload.wikimedia.org/...",
  "dealerUrl": "https://www.chevrolet.com.co/tracker",
  "source": "chevrolet.com.co",
  "_priceVerified": true
}
```

---

## 6. Paleta de colores y diseño

| Variable       | Valor     | Uso                        |
|----------------|-----------|----------------------------|
| `--bg`         | `#080b12` | Fondo principal            |
| `--surface`    | `#0f1520` | Sidebar                    |
| `--card`       | `#131b27` | Tarjetas y modales         |
| `--border`     | `#1e2d42` | Bordes y separadores       |
| `--accent`     | `#e63946` | Rojo principal (CTAs)      |
| `--accent2`    | `#22d3ee` | Cyan (verificado, comparar)|
| `--text`       | `#e8edf5` | Texto principal            |
| `--muted`      | `#7a8fa8` | Texto secundario           |
| `--font-hd`    | Barlow Condensed | Títulos, precios    |
| `--font-bd`    | Barlow    | Cuerpo, etiquetas          |

---

## 7. Ciudades disponibles

Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Cúcuta, Pereira, Manizales, Armenia, Ibagué, Santa Marta, Villavicencio, Montería, Valledupar, Pasto, Neiva, Popayán, Sincelejo, Tunja, Florencia, Riohacha, Quibdó, Mocoa, Arauca, Yopal, San Andrés.

---

## 8. Marcas disponibles en filtro

Audi, BAIC, BMW, BYD, Chery, Chevrolet, Citroën, DFSK, Fiat, Ford, GAC, Haval, Honda, Hyundai, Isuzu, JAC, JMC, Jeep, Kia, Land Rover, Lexus, Mazda, Mercedes-Benz, Mitsubishi, Nissan, Peugeot, Porsche, Ram, Renault, Subaru, Suzuki, Toyota, Volkswagen, Volvo.

---

## 9. Pendientes / Posibles mejoras futuras

- [ ] Integración directa con APIs de distribuidores colombianos (Chevrolet, Renault, Kia)
- [ ] Cotización directa vía WhatsApp Business API
- [ ] Filtro por color de carrocería
- [ ] Vista de mapa con concesionarios cercanos
- [ ] Modo comparación de cuotas de crédito (financiación)
- [ ] Historial de búsquedas recientes
- [ ] Compartir búsqueda por URL (query params)
- [ ] PWA completa con Service Worker para uso offline
- [ ] Notificaciones cuando baje el precio de un favorito
- [ ] Integración con Fasecolda para consulta de precio de referencia

---

## 10. Notas adicionales

### Nota sobre la imagen del logo
El logo oficial `Logo-AF-long.png` está incrustado como base64 directamente en el código JSX en la constante `LOGO_SRC`. Esto evita dependencias externas y garantiza que el logo siempre cargue. El logo muestra el ícono de pájaro/carretera en degradado rojo-naranja junto al texto "AUTOFINDER" con "FINDER" en rojo.

### Nota sobre el baseball scoreboard
Durante la conversación apareció una imagen de un marcador de béisbol digital (equipo VISITANTE "Los Cactus" vs LOCAL "Los Truenos", inicio del 1er inning). Esta imagen no está relacionada con el proyecto AutoFinder CO — fue enviada posiblemente por error o contexto de otro proyecto.

### Consistencia de datos
Los precios generados por `claude-haiku` son aproximaciones basadas en conocimiento de entrenamiento (mercado 2024-2025). Los marcados con "✓ Verificado" tienen confirmación via búsqueda web en tiempo real. Siempre se recomienda confirmar con el distribuidor.

---

*Documento generado automáticamente — Última actualización: sesión de desarrollo AutoFinder CO*
