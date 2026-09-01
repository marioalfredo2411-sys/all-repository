# 📁 Estructura de Archivos - PWA Juegos CCI AL

## 📋 Tabla de Contenidos

```
game_generator/
├── 📖 DOCUMENTACIÓN
│   ├── CONTEXT.md                           # Info original del proyecto
│   ├── PWA-SETUP.md                        # Guía completa de PWA
│   ├── PWA-SUMMARY.md                      # Resumen de lo creado
│   ├── IMPLEMENTATION-GUIDE.md             # Pasos técnicos detallados
│   ├── PWA-VERIFICATION-CHECKLIST.md       # Checklist de verificación
│   ├── QUICK-START.md                      # Guía rápida (5 min)
│   └── README-FILES-STRUCTURE.md            # Este archivo
│
├── 🎨 APLICACIÓN REACT
│   ├── index.html                          # HTML principal con metas PWA
│   ├── game-generator.jsx                  # Componente React principal
│   └── offline.html                        # Página mostrada sin internet
│
├── 📦 CONFIGURACIÓN PWA
│   ├── manifest.json                       # Metadata de la app
│   ├── service-worker.js                   # Cache y soporte offline
│   ├── browserconfig.xml                   # Tiles de Windows
│   └── pwa-config.json                     # Config para PWA Builder
│
├── ⚙️ CONFIGURACIÓN BUILD & DEPLOY
│   ├── vite.config.js                      # Configuración Vite
│   ├── package.json                        # Dependencias npm
│   ├── netlify.toml                        # Configuración Netlify
│   ├── .gitignore                          # Archivos ignorados Git
│   └── .env.example                        # Template variables entorno
│
└── 📂 GENERADOS (después de npm run build)
    └── build/                              # Carpeta de producción
        ├── index.html
        ├── service-worker.js
        ├── manifest.json
        ├── offline.html
        └── assets/                         # JS/CSS compilados
```

---

## 📄 Descripción de Cada Archivo

### 📖 DOCUMENTACIÓN

#### CONTEXT.md
- **Propósito:** Información original del proyecto
- **Contiene:** Stack técnico, identidad visual, arquitectura
- **Para quién:** Desarrolladores que necesitan entender el proyecto

#### PWA-SETUP.md  
- **Propósito:** Guía completa sobre características PWA
- **Contiene:** Qué es PWA, instalación en Android/iOS, troubleshooting
- **Para quién:** Usuarios y desarrolladores nuevos

#### PWA-SUMMARY.md
- **Propósito:** Resumen ejecutivo de lo creado
- **Contiene:** Checklist, arquitectura, próximos pasos
- **Para quién:** Gestores de proyecto, stakeholders

#### IMPLEMENTATION-GUIDE.md
- **Propósito:** Pasos técnicos paso a paso
- **Contiene:** Instalación, build, deploy, verificación
- **Para quién:** Desarrolladores implementando la app

#### PWA-VERIFICATION-CHECKLIST.md
- **Propósito:** Checklist técnico exhaustivo
- **Contiene:** Verificación de cada componente PWA
- **Para quién:** QA, testing, verificación pre-launch

#### QUICK-START.md
- **Propósito:** Guía rápida de 5 minutos
- **Contiene:** Comandos esenciales, instalación rápida
- **Para quién:** Desarrolladores en apuro

---

### 🎨 APLICACIÓN REACT

#### index.html
```html
<!-- Punto de entrada de la aplicación -->
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- Metas para PWA -->
  <meta name="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1A6B55" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <!-- ... más metas ... -->
</head>
<body>
  <div id="root"></div>
  <script>
    // Registra Service Worker
    navigator.serviceWorker.register('/service-worker.js');
    // Monta App React
    createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
```

**Responsabilidades:**
- Punto de entrada HTML
- Registrar Service Worker
- Metas PWA
- Montar aplicación React

#### game-generator.jsx
```javascript
// Componente principal React
// Contiene:
// - Estado (tiempo, cantidad, tipo, categoría)
// - Componentes (CCIALLogo, GameCard)
// - Llamada a API de Claude
// - Renderizado de UI
export default function App() { ... }
```

**Responsabilidades:**
- UI de la aplicación
- Gestión de estado
- Integración con Claude API
- Estilos inline

#### offline.html
```html
<!-- Página mostrada cuando no hay internet -->
<!-- Icono, mensaje, botón reintentar -->
```

**Responsabilidades:**
- Feedback cuando offline
- Botón para reintentar
- Estilo consistente con app

---

### 📦 CONFIGURACIÓN PWA

#### manifest.json
```json
{
  "name": "Juegos CCI AL - Recreación con Propósito",
  "short_name": "Juegos CCI AL",
  "description": "...",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1A6B55",
  "background_color": "#FFFFFF",
  "icons": [ ... ],
  "screenshots": [ ... ]
}
```

**Responsabilidades:**
- Define el nombre y descripción de la app
- Especifica iconos en múltiples tamaños
- Colores del tema
- Modo de visualización
- Screenshots para tiendas

#### service-worker.js
```javascript
// Intercepta requests y maneja cache

// Eventos principales:
// - install: cachea archivos
// - activate: limpia cache viejo
// - fetch: estrategia cache/network
// - push: notificaciones (futuro)
// - sync: sincronización (futuro)
```

**Responsabilidades:**
- Cachear assets
- Modo offline
- Sincronización background
- Notificaciones

#### browserconfig.xml
```xml
<!-- Configuración de tiles de Windows -->
<!-- Define iconos y colores para panel de Windows 10/11 -->
```

**Responsabilidades:**
- Iconos en Windows Start Menu
- Color de tile
- Configuración para Windows Store

#### pwa-config.json
```json
{
  "inlineManifest": true,
  "includeAssets": [ ... ],
  "optimizeImages": true,
  "minVersions": { ... },
  "deepLinks": [ ... ]
}
```

**Responsabilidades:**
- Configuración para PWA Builder
- Deep links
- Versiones mínimas
- Optimizaciones

---

### ⚙️ CONFIGURACIÓN BUILD & DEPLOY

#### vite.config.js
```javascript
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    outDir: 'build',
    minify: 'terser',
    // ... más opciones
  }
});
```

**Responsabilidades:**
- Configurar build tool Vite
- Plugins (React)
- Optimizaciones
- Carpeta de output

#### package.json
```json
{
  "name": "juegos-cci-al",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**Responsabilidades:**
- Dependencias del proyecto
- Scripts npm
- Versiones de paquetes
- Metadata del proyecto

#### netlify.toml
```toml
[build]
command = "npm install && npm run build"
publish = "build"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[[headers]]
# Headers de seguridad
# Caching strategy
```

**Responsabilidades:**
- Configuración automática en Netlify
- Build command
- Carpeta publish
- Redirects SPA
- Headers de seguridad
- Caching

#### .gitignore
```
node_modules/
build/
dist/
.env
.env.local
# ... más
```

**Responsabilidades:**
- Qué archivos ignorar en Git
- Proteger secretos (.env)
- Ignorar build artifacts

#### .env.example
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

**Responsabilidades:**
- Template de variables de entorno
- Documentar qué variables se necesitan
- Guía para nuevos desarrolladores

---

## 🔄 Flujo de Desarrollo

### 1. Desarrollo Local

```
npm install      → Instala dependencias
npm run dev      → Inicia servidor
Editar archivos  → Hot reload automático
```

### 2. Testing Local

```
DevTools → Application → Verificar SW
Lighthouse → Correr PWA audit
Instalar en dispositivo → Probar
```

### 3. Build

```
npm run build    → Compila para producción
build/ folder    → Archivos optimizados
```

### 4. Deploy

```
git push → GitHub
Netlify auto-deploy (si conectado)
O: netlify deploy --prod
```

### 5. Post-Deploy

```
Verificar en vivo
Instalar en dispositivos reales
Recopilar feedback
```

---

## 🔐 Variables de Entorno

### .env.local (local, NUNCA commitear)
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxx
```

### Netlify Env Vars (seguro en producción)
```
VITE_ANTHROPIC_API_KEY = (secreto)
```

---

## 📊 Tamaños de Archivo (Aproximados)

| Archivo | Tamaño |
|---------|--------|
| index.html | 2 KB |
| game-generator.jsx | 15 KB |
| service-worker.js | 6 KB |
| manifest.json | 3 KB |
| offline.html | 2 KB |
| browserconfig.xml | 1 KB |
| vite.config.js | 1 KB |
| package.json | 1 KB |
| **Total sin node_modules** | ~31 KB |

---

## 🚀 Comandos Rápidos

```bash
# Setup
npm install

# Desarrollo
npm run dev          # Abre en http://localhost:3000

# Verificación
npm run build        # Compila
npm run preview      # Ve la build

# Deploy
netlify deploy --prod

# Limpieza
rm -rf build
rm -rf node_modules
npm install
```

---

## 📞 Estructura de Carpetas Alternativa

Si prefieres organizar así:

```
game_generator/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── GameCard.jsx
│   │   └── CCIALLogo.jsx
│   ├── styles/
│   │   └── App.css
│   └── sw.js
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── docs/
│   ├── PWA-SETUP.md
│   ├── IMPLEMENTATION-GUIDE.md
│   └── ...
└── vite.config.js
```

**Requeriría cambios en:**
- `vite.config.js` → root: 'src/'
- `index.html` → <script src="src/App.jsx">
- Paths en `manifest.json`

---

## ✅ Checklist de Verificación de Estructura

- [ ] Todos los .md archivos presentes
- [ ] Todos los archivos de configuración presentes
- [ ] index.html tiene metas PWA correctas
- [ ] manifest.json es válido JSON
- [ ] service-worker.js no tiene errores
- [ ] package.json tiene scripts correctos
- [ ] netlify.toml configurado
- [ ] .gitignore presente
- [ ] .env.example como template

---

## 🎓 Para Aprender Más

- **MDN:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Web.dev:** https://web.dev/progressive-web-apps/
- **Vite Docs:** https://vitejs.dev/
- **React Docs:** https://react.dev/

---

**Última actualización:** 2026-08-31  
🏕️ CCI América Latina
