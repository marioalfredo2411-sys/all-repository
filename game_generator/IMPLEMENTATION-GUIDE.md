# 🎮 Guía de Implementación PWA - Juegos CCI AL

## 📋 Pre-requisitos

- Node.js 16+ instalado ([nodejs.org](https://nodejs.org))
- npm o yarn
- Git (opcional, para versionado)
- Una clave de API de Anthropic Claude ([console.anthropic.com](https://console.anthropic.com))

---

## 🚀 Paso 1: Preparar el Proyecto

### 1.1 Estructura de carpetas

Tu proyecto debe lucir así:

```
game_generator/
├── index.html                 # ← Página principal
├── offline.html               # ← Página offline
├── game-generator.jsx         # ← Componente React
├── service-worker.js          # ← Service Worker
├── manifest.json              # ← Configuración PWA
├── browserconfig.xml          # ← Configuración Windows
├── vite.config.js             # ← Configuración Vite
├── package.json               # ← Dependencias
├── netlify.toml               # ← Configuración Netlify
├── pwa-config.json            # ← Configuración PWABuilder
├── .env.example               # ← Template de env
├── .gitignore                 # ← Ignorar archivos
├── CONTEXT.md                 # ← Documentación
└── PWA-SETUP.md               # ← Guía PWA
```

### 1.2 Variables de entorno

```bash
# En la raíz del proyecto, crear .env.local
cp .env.example .env.local

# Editar .env.local y agregar tu API key de Claude
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxx
```

> ⚠️ **IMPORTANTE**: Nunca commitear `.env.local` (ya está en `.gitignore`)

---

## 📦 Paso 2: Instalar Dependencias

```bash
# Navegar al directorio del proyecto
cd game_generator

# Instalar Node modules
npm install

# Verificar instalación
npm list
```

**Paquetes instalados:**
- `react` - Framework
- `react-dom` - Renderizador
- `vite` - Build tool
- `@vitejs/plugin-react` - Plugin para React

---

## 🧪 Paso 3: Probar Localmente

### 3.1 Ejecutar servidor de desarrollo

```bash
npm run dev
```

Se abrirá automáticamente en `http://localhost:3000`

### 3.2 Verificar Service Worker

1. Abre DevTools (F12)
2. Ve a pestaña **Application**
3. Lado izquierdo → **Service Workers**
4. Deberías ver el SW registrado con estado "activated and running"

### 3.3 Verificar que es PWA

1. DevTools → **Application** → **Manifest**
2. Verifica que todos los campos estén presentes:
   - ✅ name, short_name, description
   - ✅ icons (con tamaños)
   - ✅ theme_color, background_color
   - ✅ display: "standalone"

### 3.4 Lighthouse Report

1. DevTools → **Lighthouse**
2. Selecciona **PWA**
3. Haz clic en "Analyze page load"
4. Deberías ver puntuación 90+ en todos

---

## 🏗️ Paso 4: Build para Producción

```bash
# Compilar el proyecto
npm run build

# Esto genera la carpeta `build/` con archivos optimizados
```

**Archivos generados:**
- `build/index.html` - HTML compilado
- `build/service-worker.js` - SW optimizado
- `build/manifest.json` - Manifest
- `build/offline.html` - Página offline
- `build/assets/` - JS/CSS compilados

### 4.1 Probar build localmente

```bash
npm run preview

# Abrirá el servidor en http://localhost:4173 con la build de prod
```

---

## 🌐 Paso 5: Desplegar en Netlify

### Opción A: Conectar Repositorio GitHub (Recomendado)

1. Sube tu proyecto a GitHub
2. Ve a [netlify.com](https://netlify.com) → Crea cuenta gratis
3. Haz clic en **"Add new site"** → **"Import an existing project"**
4. Selecciona **GitHub** → Autoriza
5. Elige tu repositorio
6. Configuración automática (ya está en `netlify.toml`):
   - Build command: `npm install && npm run build`
   - Publish directory: `build/`
7. Haz clic en **"Deploy site"**
8. ¡Listo! Tu PWA está en vivo en `https://[nombre-random].netlify.app`

### Opción B: Usar Netlify CLI (Sin GitHub)

```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod

# Se te pedirá confirmar la carpeta a deployar
# Selecciona: build/
```

### Opción C: Drag & Drop (Más rápido)

1. Ejecuta `npm run build`
2. Ve a [netlify.com](https://netlify.com)
3. Arrastra la carpeta `build/` a la página
4. ¡Hecho en 30 segundos!

---

## ✅ Paso 6: Verificar PWA en Vivo

Una vez deployado en Netlify:

### 6.1 Acceder a la app

1. Ve a `https://tu-sitio.netlify.app`
2. Deberías ver la interfaz de Juegos CCI AL

### 6.2 Instalar en Android

1. Abre en Chrome/Edge/Firefox
2. Toca menú ⋮ → "Instalar app"
3. Confirma
4. ✅ La app aparecerá en tu pantalla de inicio

### 6.3 Instalar en iOS

1. Abre en **Safari** (importante: Safari, no Chrome)
2. Toca botón Compartir ↗️
3. Selecciona "Agregar a Pantalla de Inicio"
4. Confirma
5. ✅ La app estará en tu pantalla de inicio

### 6.4 Probar modo offline

1. Instala la app en tu dispositivo
2. Desactiva WiFi e internet
3. Abre la app
4. Deberías ver la página offline o cachés anteriores

---

## 🔐 Paso 7: Configurar Seguridad

### 7.1 Proteger API Key

Tu clave de Anthropic nunca debe exponerse. Netlify ya la protege:

1. En Netlify → **Settings** → **Build & Deploy** → **Environment**
2. Agrega variable: `VITE_ANTHROPIC_API_KEY` con tu clave
3. Vuelve a deployar (git push)
4. ✅ La variable se inyecta en build time, nunca se expone al cliente

### 7.2 Headers de Seguridad

El archivo `netlify.toml` ya incluye:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- Política de referrer segura

---

## 🎯 Paso 8: Distribución Avanzada (Opcional)

### 8.1 Publizar en Microsoft Store

1. Usa [PWA Builder](https://www.pwabuilder.com/)
2. Ingresa URL: `https://tu-sitio.netlify.app`
3. Descarga paquete `.msixbundle`
4. Sube a Microsoft Store

### 8.2 Publizar en Google Play

1. Necesitas:
   - App empaquetada con TWA (Trusted Web Activity)
   - Certificados digitales
2. Usa PWA Builder → **Microsoft Store** → **Package for stores**
3. O contacta a desarrollador Android

### 8.3 Chrome Web Store (Futuro)

1. Cuando esté más maduro
2. Usa Chrome Web Store Developer Dashboard
3. Sube archivo `.crx`

---

## 📊 Paso 9: Monitoreo y Mantenimiento

### 9.1 Analytics en Netlify

1. Netlify Dashboard → **Analytics**
2. Ver tráfico, ubicaciones, dispositivos
3. Exportar datos

### 9.2 Logs de Error

1. Netlify → **Logs** → **Function logs** (si usas serverless)
2. O revisar navegador del usuario (DevTools)

### 9.3 Actualizar la App

Para hacer cambios:

```bash
# 1. Editar archivos
# 2. Commit y push
git add .
git commit -m "Mejoras a la app"
git push

# Netlify deployará automáticamente
# El Service Worker notificará a usuarios sobre nueva versión
```

---

## 🛠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| **PWA no se instala en Android** | Verificar HTTPS, manifest válido, 192x192 icon |
| **No funciona sin conexión** | Limpiar cache (DevTools → App → Clear storage) |
| **API Key no carga** | Verificar `.env.local` o Netlify env vars |
| **Cambios no aparecen** | Hard refresh (Ctrl+Shift+R), limpiar SW cache |
| **No aparece icono de instalar** | Esperar 48h, o forzar con DevTools |
| **iOS: "No puede accederse a esta página"** | Abrir en Safari, verificar HTTPS |

---

## 📚 Recursos Útiles

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.pwabuilder.com/generator)
- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Install Banners](https://developer.chrome.com/docs/web-platform/app-install-banners/)

---

## 🎉 ¡Listo!

Tu PWA está listo para:
- ✅ Instalarse en Android como app nativa
- ✅ Instalarse en iOS en pantalla de inicio
- ✅ Funcionar offline
- ✅ Recibir notificaciones
- ✅ Acceso a pantalla de inicio
- ✅ Rendimiento optimizado

**Próximos pasos:**
1. Distribuir link a usuarios
2. Recopilar feedback
3. Hacer mejoras según uso
4. Considerar publicar en tiendas oficiales

---

## 🏕️ CCI América Latina

**Mayordomía · Recreación con Propósito · Comunidad · Fe**

¡Gracias por utilizar Juegos CCI AL! 🎮🎉
