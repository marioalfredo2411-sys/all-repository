# ✅ PWA Verification Checklist

Use this checklist to ensure your PWA meets all standards for installation on Android and iOS.

---

## 🔍 Pre-Deployment Checks

### Build & Configuration

- [ ] `npm install` completa sin errores
- [ ] `npm run build` genera carpeta `build/` sin errores
- [ ] `package.json` contiene:
  - [ ] `"type": "module"`
  - [ ] Scripts: `dev`, `build`, `preview`
  - [ ] Dependencias: `react`, `react-dom`
  - [ ] DevDeps: `vite`, `@vitejs/plugin-react`

### Files Present

- [ ] `index.html` - Existe y contiene `<div id="root">`
- [ ] `game-generator.jsx` - Componente React principal
- [ ] `service-worker.js` - Service Worker registrado
- [ ] `manifest.json` - Manifest válido
- [ ] `offline.html` - Fallback offline
- [ ] `vite.config.js` - Configuración Vite
- [ ] `netlify.toml` o similar - Configuración deploy
- [ ] `.env.example` - Template de variables

### Local Testing

- [ ] `npm run dev` inicia sin errores
- [ ] App abre en `http://localhost:3000`
- [ ] Interfaz se ve correctamente
- [ ] Formulario funciona (tiempo, cantidad, categoría)
- [ ] Botón "Generar Juegos" genera respuesta

---

## 📋 Manifest Verification

### Required Fields

- [ ] `"name"`: "Juegos CCI AL - Recreación con Propósito"
- [ ] `"short_name"`: "Juegos CCI AL"
- [ ] `"description"`: Presente y descriptiva
- [ ] `"start_url"`: "/" definida
- [ ] `"scope"`: "/" definida
- [ ] `"display"`: "standalone" (crucial para instalación)
- [ ] `"theme_color"`: "#1A6B55" (verde CCI)
- [ ] `"background_color"`: "#FFFFFF"
- [ ] `"orientation"`: "portrait-primary" o "portrait"

### Icons

- [ ] Icons de tamaños: 192x192, 512x512
- [ ] Icono "any" purpose (normal)
- [ ] Icono "maskable" purpose (para notches)
- [ ] Todos tienen `"type"`: "image/svg+xml" o similar
- [ ] SVG válido (sin caracteres corruptos)

### Optional but Recommended

- [ ] `"categories"`: ["recreation", "games", "education"]
- [ ] `"screenshots"`: Para tiendas de apps
- [ ] `"shortcuts"`: Para acceso rápido
- [ ] `"share_target"`: Para compartir con la app

---

## 🔧 Service Worker Verification

### Registration

- [ ] Service Worker registrado en `index.html`
- [ ] Ubicación: `/service-worker.js`
- [ ] Evento `"load"` antes de registrar
- [ ] Manejo de errores en registro

### Functionality

- [ ] `install` event copia archivos a cache
- [ ] `activate` event limpia caches viejos
- [ ] `fetch` event intercepta requests
- [ ] Cache strategy definida:
  - [ ] Network First para APIs
  - [ ] Cache First para assets
  - [ ] Fallback a offline.html

### Code Quality

- [ ] Sin errores de sintaxis
- [ ] Console.log para debugging (opcional remover)
- [ ] Manejo de errores con try/catch
- [ ] Fetch requests tienen timeout/fallback

---

## 🌐 HTML Verification

### Meta Tags (index.html)

- [ ] `<meta charset="UTF-8">`
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
- [ ] `<meta name="theme-color" content="#1A6B55">`
- [ ] `<meta name="description" content="...">`
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">`
- [ ] `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- [ ] `<meta name="apple-mobile-web-app-title" content="Juegos CCI AL">`
- [ ] `<link rel="manifest" href="/manifest.json">`
- [ ] `<link rel="icon" href="...">`
- [ ] `<link rel="apple-touch-icon" href="...">`

### Body & Root

- [ ] `<div id="root"></div>` presente
- [ ] Scripts cargados correctamente
- [ ] React y ReactDOM importados
- [ ] App montada en `#root`

### Styling

- [ ] Estilos inline o CSS disponible
- [ ] No hay broken imports
- [ ] Safe area insets configurados (iOS notch)

---

## 🖥️ DevTools Verification

### Chrome/Edge DevTools → Application

#### Service Workers Tab
- [ ] Service Worker listado
- [ ] Status: "activated and running"
- [ ] Scope: "/"
- [ ] Update on reload: enabled (opcional)

#### Manifest Tab
- [ ] Manifest cargado desde `/manifest.json`
- [ ] Sin errores (rojo)
- [ ] Todos los campos presentes
- [ ] Icons con URLs válidas

#### Cache Storage
- [ ] Cache creado (ej: "juegos-cci-al-v1")
- [ ] Archivos cacheados presentes
- [ ] Size visible

### Lighthouse Report

**Correr análisis:**
- [ ] DevTools → Lighthouse
- [ ] Seleccionar "PWA"
- [ ] Analizar página

**Criterios PWA:**
- [ ] Installation: ✅ Pasando
- [ ] Installability: ✅ Pasando
- [ ] Offline support: ✅ Pasando
- [ ] Network connectivity: ✅ Pasando
- [ ] Appearance: ✅ Pasando
- [ ] Display: ✅ Pasando
- [ ] Orientation: ✅ Pasando
- [ ] Icons: ✅ Pasando
- [ ] Splash screen: ✅ Pasando
- [ ] Theme color: ✅ Pasando
- [ ] Status bar: ✅ Pasando
- [ ] Shortcuts: ✅ Pasando

**Puntuación:**
- [ ] PWA: 90+
- [ ] Performance: 80+ (local)
- [ ] Best Practices: 90+
- [ ] Accessibility: 80+

---

## 📱 Install Verification

### Android (Chrome/Edge/Firefox)

**Pre-requisitos:**
- [ ] App corriendo en HTTPS (o localhost para dev)
- [ ] Manifest válido y accesible
- [ ] Icons presentes
- [ ] Display: "standalone"

**Instalación:**
- [ ] Icono "Instalar" aparece en barra de direcciones
- [ ] O toca menú ⋮ → "Instalar app"
- [ ] Dialog de confirmación aparece
- [ ] App se instala en pantalla de inicio
- [ ] App abre en modo standalone (sin URL bar)
- [ ] App usa theme-color en status bar

**Post-instalación:**
- [ ] App funciona sin conexión (parcialmente)
- [ ] Icono es visible en pantalla de inicio
- [ ] App name es correcto
- [ ] Splash screen muestra theme_color

### iOS (Safari)

**Pre-requisitos:**
- [ ] Abierto en **Safari** (no Chrome)
- [ ] App en HTTPS
- [ ] Manifest válido

**Instalación:**
- [ ] Botón Compartir ↗️ visible
- [ ] Toca → "Agregar a Pantalla de Inicio"
- [ ] Popup para nombre aparece
- [ ] Apple touch icon se muestra en preview
- [ ] Tap "Añadir" en esquina superior derecha
- [ ] App instalada en home screen

**Post-instalación:**
- [ ] App abre en modo fullscreen
- [ ] Status bar se adapta (notch compatible)
- [ ] Home indicator visible (iOS 13+)
- [ ] App name es correcto
- [ ] Icono es el que configuramos
- [ ] Funciona sin conexión

---

## 🔒 Security Verification

### HTTPS

- [ ] Sitio deployado con HTTPS forzado
- [ ] Certificado válido (no self-signed en prod)
- [ ] Redirect HTTP → HTTPS funcionando
- [ ] DevTools muestra 🔒 verde

### Headers

Verificar en Network tab de DevTools:

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### API Keys

- [ ] Clave de Anthropic en `.env.local`
- [ ] `.env.local` está en `.gitignore`
- [ ] No está clave en `package.json`
- [ ] Variables de entorno en Netlify/Vercel
- [ ] Build time secrets, no runtime

---

## 🌍 Network Verification

### Offline Mode

1. Instala la app
2. Desactiva WiFi + Mobile data
3. Abre la app

- [ ] App abre (desde cache)
- [ ] Contenido anterior visible
- [ ] Sin errores de conexión
- [ ] Muestra offline.html si no hay cache

### Online Mode

1. Activa conexión
2. Abre app

- [ ] Service Worker comprueba actualizaciones
- [ ] Fetch normal funciona
- [ ] API Claude responde

### Slow Network (Throttling)

En DevTools → Network:
- [ ] Selecciona "Slow 3G" o "Fast 3G"
- [ ] Recarga
- [ ] App sigue siendo usable
- [ ] No hay timeouts

---

## 🎨 UI/UX Verification

### Responsive

- [ ] Funciona en 320px (iPhone SE)
- [ ] Funciona en 1200px (Desktop)
- [ ] Funciona en 600px (Tablet vertical)
- [ ] Funciona en 900px (Tablet horizontal)
- [ ] Sin scroll horizontal
- [ ] Texto legible

### Notch Support (iOS)

- [ ] Contenido no escondido bajo notch
- [ ] Padding en top/bottom
- [ ] Status bar visible
- [ ] Safe area insets aplicados

### Dark Mode (opcional)

- [ ] Si soporta: theme-color adapta
- [ ] Colors visible en modo oscuro
- [ ] No hay contraste bajo

---

## 📊 Performance Verification

### Lighthouse Metrics

- [ ] FCP (First Contentful Paint): < 1.8s
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] Speed Index: < 3.4s
- [ ] FID (First Input Delay): < 100ms
- [ ] TTFB (Time to First Byte): < 0.6s

### Bundle Size

- [ ] Main bundle: < 500KB (gzipped < 150KB ideal)
- [ ] Service Worker: < 50KB
- [ ] Manifest + icons: < 100KB total

### Caching

- [ ] Assets have long cache headers
- [ ] Manifest/SW have cache: max-age=0
- [ ] Invalidation strategy definida

---

## 🚀 Deployment Verification

### Netlify

- [ ] Repositorio conectado
- [ ] Build log sin errores
- [ ] Deploy preview funciona
- [ ] Production deploy en vivo
- [ ] Site URL accesible
- [ ] SSL certificate válido

### Environment Variables

- [ ] `VITE_ANTHROPIC_API_KEY` configurada
- [ ] Build rebuild necesario después de cambiar vars
- [ ] Vars no visibles en cliente

### Redirects

- [ ] Archivo `netlify.toml` presente
- [ ] Redirect `/*` → `index.html` funciona
- [ ] SPA routing funciona (ej: `/generate`)

---

## 🔄 Maintenance Checklist

### Regular Checks (Monthly)

- [ ] Lighthouse score sigue siendo 90+
- [ ] No hay broken links
- [ ] PWA still installable en test devices
- [ ] Service Worker working
- [ ] No console errors

### Security Checks (Quarterly)

- [ ] Dependencies actualizado (`npm audit`)
- [ ] No vulnerabilities en npm packages
- [ ] HTTPS certificate válido
- [ ] API keys rotadas si necesario

### Analytics (Monthly)

- [ ] Monitor usuarios instalados
- [ ] Revisar crashlog (si existe)
- [ ] Revisar performance metrics
- [ ] Revisar user feedback

---

## 📝 Sign-Off

Once all items are checked, sign here:

**Verified by:** _________________________  
**Date:** _________________________  
**Version:** 1.0.0  
**Ready for Distribution:** YES / NO

---

*PWA Checklist v1.0 - Juegos CCI AL*
