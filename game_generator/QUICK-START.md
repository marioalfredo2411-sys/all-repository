# 🚀 GUÍA RÁPIDA - PWA Juegos CCI AL

## ⚡ 5 Minutos para Comenzar

### Paso 1: Instalar Dependencias (2 min)

```bash
cd game_generator
npm install
```

### Paso 2: Probar Localmente (1 min)

```bash
npm run dev
```

Se abrirá automáticamente en `http://localhost:3000` ✅

### Paso 3: Verificar PWA (1 min)

1. Abre DevTools (F12)
2. Ve a **Application** → **Service Workers**
3. Deberías ver el Service Worker "activated and running"

### Paso 4: Construir para Producción (1 min)

```bash
npm run build
```

Se generará la carpeta `build/` con todo listo.

---

## 🌐 Desplegar en Netlify (Opción 1 - Recomendada)

### 1️⃣ Subir a GitHub

```bash
git add .
git commit -m "PWA Juegos CCI AL"
git push
```

### 2️⃣ Conectar a Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Selecciona GitHub → Tu repositorio
4. Haz clic en **Deploy**

¡Listo! Tu PWA estará en vivo en ~2 minutos.

---

## 🌐 Desplegar en Netlify (Opción 2 - Más Rápida)

### 1️⃣ Instalar CLI

```bash
npm install -g netlify-cli
```

### 2️⃣ Autenticar

```bash
netlify login
```

### 3️⃣ Deployar

```bash
npm run build
netlify deploy --prod
```

¡Listo en 30 segundos! 🎉

---

## 📱 Instalar en Android

1. Abre la app en **Chrome** (en tu teléfono Android)
2. Espera a que aparezca el icono "Instalar" en la barra de direcciones
3. Toca el icono → "Instalar"
4. Confirma
5. ✅ La app aparecerá en tu pantalla de inicio

**O:**
1. Toca el menú ⋮ (tres puntos)
2. Selecciona **"Instalar app"**
3. Confirma

---

## 📱 Instalar en iOS

1. Abre la app en **Safari** (importante: Safari, NO Chrome)
2. Toca el icono **Compartir** ↗️ (esquina inferior derecha)
3. Selecciona **"Agregar a Pantalla de Inicio"**
4. Dale un nombre (por defecto "Juegos CCI AL")
5. Toca **"Añadir"** (esquina superior derecha)
6. ✅ La app estará en tu pantalla de inicio

---

## 🧪 Verificación Rápida

### ✅ Checklist Mínimo

- [ ] `npm run dev` funciona
- [ ] DevTools → Application → Service Worker visible
- [ ] Lighthouse → PWA: 90+
- [ ] Build sin errores
- [ ] Deployado en Netlify
- [ ] Instala en Android
- [ ] Instala en iOS
- [ ] Funciona sin conexión

---

## ⚙️ Configurar API Key (Importante)

> La key **solo se usa en el servidor** (Netlify Function `/api/generate` en
> producción; middleware de Vite en local). **Nunca llega al navegador**, por eso
> la variable **NO** lleva el prefijo `VITE_`.

### Opción A: En tu PC (desarrollo local)

1. Abre `game_generator/.env.local` (ya existe)
2. Pega tu clave:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxx
```

3. Guarda
4. Reinicia `npm run dev`
5. Genera juegos desde la app ✅

### Opción B: En Netlify (producción)

1. Netlify Dashboard → Tu sitio → **Site settings**
2. **Environment variables** → **Add a variable**
3. Agrega:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** Tu clave de Claude
4. Guarda
5. **Deploys** → **Trigger deploy** → **Deploy site**

> ⚠️ **IMPORTANTE**: Nunca compartas tu API key ni la subas a git (`.env.local`
> ya está en `.gitignore`).

---

## 🔧 Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar la build
npm run preview

# Limpiar caché local
rm -rf node_modules package-lock.json
npm install

# Ver logs de Netlify
netlify logs

# Forzar redeploy
netlify deploy --prod --force
```

---

## 🐛 Soluciones Rápidas

### "No puedo instalar en Android"

✅ Soluciones:
1. Usa Chrome (no Firefox/Edge en algunos casos)
2. Espera 48h en algunos navegadores
3. Asegúrate de tener HTTPS
4. Limpia caché: Configuración → Historial → Borrar datos

### "No puedo instalar en iOS"

✅ Soluciones:
1. Abre en **Safari** (no Chrome, no Firefox)
2. Verifica que sea HTTPS
3. Copia URL a la barra de direcciones
4. Toca Compartir ↗️

### "No funciona sin conexión"

✅ Soluciones:
1. DevTools → Application → Cache Storage → Verifica archivos en cache
2. Limpia: Settings → Privacy → Clear browsing data → Cookies and cached images
3. Desinstala y reinstala la app

### "Los cambios no aparecen"

✅ Soluciones:
1. Hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
2. DevTools → Application → Service Workers → Unregister
3. Limpia cache del navegador

---

## 📚 Documentos Importantes

| Documento | Para qué |
|-----------|----------|
| **PWA-SETUP.md** | Guía completa y detallada |
| **IMPLEMENTATION-GUIDE.md** | Pasos técnicos paso a paso |
| **PWA-VERIFICATION-CHECKLIST.md** | Verificación exhaustiva |
| **CONTEXT.md** | Info del proyecto original |

---

## 🎯 Pasos Siguientes

### 1. Después de Desplegar

- [ ] Compartir URL con usuarios
- [ ] Probar en múltiples dispositivos
- [ ] Recopilar feedback
- [ ] Hacer ajustes según uso

### 2. Para Mejorar

- [ ] Agregar Push Notifications
- [ ] Implementar Share Target
- [ ] Agregar historial de juegos
- [ ] Temas personalizables
- [ ] Modo dark

### 3. Para Distribuir

- [ ] Microsoft Store (via PWA Builder)
- [ ] Google Play (requiere TWA)
- [ ] Chrome Web Store (futuro)

---

## 🏕️ ¡Listo!

Tu PWA está **completamente configurado** para:

✅ Instalar en **Android** como app nativa  
✅ Instalar en **iOS** en pantalla de inicio  
✅ Funcionar **sin conexión**  
✅ Aparecer en **pantalla de inicio**  
✅ Competir con **apps de tienda**

---

## 📞 Recursos Útiles

- **Clave de Claude:** https://console.anthropic.com
- **Netlify:** https://netlify.com
- **PWA Builder:** https://pwabuilder.com
- **Web.dev PWA:** https://web.dev/pwa-checklist/

---

**Creado:** 2026-08-31  
🏕️ CCI América Latina - Mayordomía · Recreación con Propósito · Comunidad · Fe
