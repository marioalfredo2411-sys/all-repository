# 🎮 Juegos CCI AL - PWA 📲

Aplicación web progresiva (PWA) para generar listas de juegos grupales usando inteligencia artificial. **Instalable en Android e iOS como aplicación nativa.**

## ✨ Características del PWA

### 📱 Instalación en dispositivos
- ✅ **Android**: Instalar como app nativa desde Chrome, Edge, Firefox
- ✅ **iOS**: Instalar con "Agregar a pantalla de inicio" en Safari
- ✅ **Windows/Mac**: Instalar como app de escritorio en Edge y Chrome
- ✅ **Offline**: Funciona sin conexión a Internet (modo limitado)
- ✅ **Notificaciones**: Recibe actualizaciones y notificaciones

### 🎨 Experiencia de usuario
- Interfaz completamente responsiva y adaptada a notches
- Acceso rápido con shortcuts desde pantalla de inicio
- Tema personalizado con colores de CCI AL
- Icono y splash screen nativos
- Soporte para dark mode en algunos sistemas

### ⚡ Rendimiento
- Service Worker para cache inteligente
- Carga rápida y offline-first
- Sincronización de datos en background
- Optimización de imágenes y assets

---

## 🚀 Instalación del PWA

### En Android

#### Desde Chrome/Edge/Firefox:
1. Abre la app en el navegador
2. Toca el menú (⋮) → "Instalar app"
3. Confirma la instalación
4. ¡La app aparecerá en tu pantalla de inicio!

#### Desde Firefox:
1. Abre la app → Toca el menú
2. Selecciona "Instalar en pantalla de inicio"

### En iOS (Safari)

1. Abre la app en Safari
2. Toca el botón Compartir (↗️)
3. Selecciona "Agregar a Pantalla de Inicio"
4. Elige un nombre (por defecto "Juegos CCI AL")
5. Toca "Añadir" en la esquina superior derecha

> **Nota:** En iOS, el app tiene acceso limitado a funciones del sistema pero funciona como una app nativa.

### En PC/Mac

#### Chrome/Edge:
1. Haz clic en la barra de direcciones
2. Busca el icono "Instalar" o el menú ⋮
3. Selecciona "Instalar app"
4. Confirma

#### Safari (Mac):
1. Menú Archivo → "Agregar a aplicaciones"

---

## 📦 Archivos PWA Principales

| Archivo | Propósito |
|---------|-----------|
| `manifest.json` | Metadatos de la app (nombre, iconos, colores, etc.) |
| `service-worker.js` | Cache inteligente, soporte offline |
| `index.html` | HTML principal con metas PWA y registro del SW |
| `offline.html` | Página que se muestra sin conexión |
| `browserconfig.xml` | Configuración para Windows/Tiles |
| `pwa-config.json` | Configuración para PWABuilder |
| `netlify.toml` | Configuración de despliegue en Netlify |

---

## 🛠️ Desarrollo Local

### Requisitos
- Node.js 16+
- npm o yarn

### Instalación y ejecución

```bash
# Clonar o entrar al directorio del proyecto
cd game_generator

# Instalar dependencias
npm install

# Ejecutar en desarrollo (hot reload)
npm run dev

# Compilar para producción
npm run build

# Vista previa de la build
npm npm run preview
```

El servidor estará disponible en `http://localhost:3000`

---

## 🌐 Despliegue en Netlify

### Opción 1: Conectar repositorio Git

1. Ve a [netlify.com](https://netlify.com)
2. Haz clic en "New site from Git"
3. Conecta tu repositorio GitHub
4. Configura:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `build/`
5. Haz clic en "Deploy"

### Opción 2: Deploy desde CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# O interactivo
netlify deploy --prod --open
```

### Opción 3: Drag & Drop

1. Ve a [netlify.com](https://netlify.com)
2. Ejecuta `npm run build`
3. Arrastra la carpeta `build/` a Netlify
4. ¡Listo! Tu PWA está en vivo

### Configuración en Netlify

- El archivo `netlify.toml` ya contiene:
  - Redirecciones para SPA
  - Headers de seguridad
  - Caching optimizado
  - Configuración CORS

---

## 🌍 Despliegue en otros servicios

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### GitHub Pages
```bash
npm run build
# Subir contenido de `build/` a rama `gh-pages`
```

---

## 📋 Verificar que es un PWA válido

### Usando Lighthouse (Chrome DevTools)
1. Abre DevTools (F12)
2. Ve a "Lighthouse"
3. Selecciona "PWA"
4. Haz clic en "Analizar carga de página"
5. Deberías ver ✅ en todos los criterios

### Checklist manual
- ✅ Manifest.json válido y accesible
- ✅ Service Worker registrado
- ✅ HTTPS activado (necesario para PWA)
- ✅ Icono 192x192 definido
- ✅ Página offline disponible
- ✅ theme_color en manifest
- ✅ Página responsive

---

## 🔒 Seguridad y Privacidad

El PWA incluye:
- **HTTPS requerido** (automático en Netlify, Vercel, etc.)
- **Headers de seguridad** (X-Content-Type-Options, CSP, etc.)
- **Sin seguimiento** de usuarios (sin analítica de terceros)
- **API Key cifrada** (usar variables de entorno)
- **Service Worker confiable** (validación de contenido)

**Variables de entorno:**
```bash
# .env
VITE_ANTHROPIC_API_KEY=tu_clave_aqui
```

> ⚠️ **NUNCA** commits keys en el repo. Usa variables de entorno en Netlify/Vercel.

---

## 🎯 Funcionalidades Avanzadas

### Notificaciones Push (futuro)
Implementado en `service-worker.js`. Para activar:
1. Solicitar permiso al usuario
2. Suscribirse a push desde el navegador
3. Enviar notificaciones desde el backend

### Sincronización de Datos (futuro)
El SW escucha `sync` events para sincronizar datos en background.

### Share Target (futuro)
Los usuarios pueden compartir contenido con la app.

---

## 📊 Monitoreo y Estadísticas

Después del despliegue, puedes ver:
- **Netlify Analytics**: Tráfico y geolocalización
- **Chrome Web Store** (futuro): Distribución desde tienda oficial
- **PWA Stats**: Usuarios instalados

---

## 🐛 Troubleshooting

### "No se puede instalar en iOS"
- ✅ Abre en **Safari** (no Chrome en iOS)
- ✅ Verifica que sea HTTPS
- ✅ Revisa que `manifest.json` sea válido

### "Service Worker no se actualiza"
- ✅ Limpia cache: Configuración → Historial → Borrar datos de navegación
- ✅ Fuerza recarga: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
- ✅ Desinstala y reinstala la app

### "No funciona offline"
- ✅ Verifica que el SW esté activo en DevTools → Application
- ✅ Comprueba la sección Cache Storage
- ✅ Revisa la consola del SW

### "CORS o permisos API"
- ✅ Usa `VITE_` prefix en variables de entorno
- ✅ Verifica que Netlify tenga acceso a la clave API
- ✅ Configura CORS en backend si es necesario

---

## 📚 Recursos

- [MDN - Progressive Web Apps](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
- [Web.dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Generator](https://www.pwabuilder.com/generator)
- [Service Worker Docs](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)

---

## 📄 Licencia

© 2024 CCI América Latina  
Licencia MIT

---

## 🏕️ Valores de CCI AL

**Mayordomía · Recreación con Propósito · Comunidad · Fe**

Esta aplicación fue creada con el propósito de facilitar recreación significativa que fortalezca la comunidad y el crecimiento personal.

---

## 📞 Soporte

Para problemas o sugerencias:
- 📧 Contacta a CCI AL
- 🐛 Reporta issues en GitHub
- 💬 Sugiere mejoras

¡Gracias por usar Juegos CCI AL! 🎉
