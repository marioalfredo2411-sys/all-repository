/**
 * Genera `www/`, el directorio que Capacitor empaqueta dentro de la app nativa.
 *
 * La fuente de verdad sigue siendo `index.html` en la raíz (el mismo archivo que
 * se despliega en Netlify). Aquí se copia y se adapta al contexto nativo:
 *   - se quita el registro del Service Worker (Capacitor sirve desde el bundle)
 *   - se quita el <link rel="manifest"> (irrelevante dentro de la app)
 *   - se inyectan native.css y native.js (bundleado con esbuild)
 *
 * Uso:  npm run build      → www/
 *       npm run sync       → www/ + copia a android/ e ios/
 */
import { build } from 'esbuild';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WWW = join(ROOT, 'www');

// Assets que se copian tal cual al bundle nativo.
const STATIC_ASSETS = ['icon-192.png', 'icon-512.png'];

// Leaflet y las tipografías: sin esto la app nativa necesitaría internet
// solo para arrancar, que es justo lo que no se puede dar por hecho.
const STATIC_DIRS = ['vendor'];

async function main() {
  await rm(WWW, { recursive: true, force: true });
  await mkdir(WWW, { recursive: true });

  await bundleNativeLayer();
  await copyFile(join(ROOT, 'src', 'native.css'), join(WWW, 'native.css'));
  for (const asset of STATIC_ASSETS) {
    await copyFile(join(ROOT, asset), join(WWW, asset));
  }
  for (const dir of STATIC_DIRS) {
    await cp(join(ROOT, dir), join(WWW, dir), { recursive: true });
  }

  await writeFile(join(WWW, 'index.html'), await transformHtml(), 'utf8');

  console.log('✓ www/ generado');
}

async function bundleNativeLayer() {
  await build({
    entryPoints: [join(ROOT, 'src', 'native.js')],
    outfile: join(WWW, 'native.js'),
    bundle: true,
    format: 'iife',
    target: ['es2019'],
    minify: true,
    logLevel: 'warning',
  });
}

async function transformHtml() {
  let html = await readFile(join(ROOT, 'index.html'), 'utf8');

  // El Service Worker sobra dentro del WebView y puede servir respuestas viejas.
  html = html.replace(
    /<script>\s*if\('serviceWorker' in navigator\)[\s\S]*?<\/script>\s*/,
    ''
  );
  html = html.replace(/<link rel="manifest"[^>]*>\s*/, '');

  // Los splash de iOS los gestiona el plugin nativo SplashScreen; estas etiquetas
  // apuntarían a icons/, que no se empaqueta, provocando 404 en el WebView.
  html = html.replace(/<link rel="apple-touch-startup-image"[^>]*>\s*/g, '');
  html = html.replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '');
  html = html.replace(
    /<!--\s*Pantallas de inicio para[\s\S]*?-->\s*/,
    ''
  );

  const injection = [
    '<link rel="stylesheet" href="native.css">',
    '<script src="native.js" defer></script>',
  ].join('\n');

  if (!html.includes('</head>')) {
    throw new Error('index.html no tiene </head>; no se pudo inyectar la capa nativa');
  }
  return html.replace('</head>', `${injection}\n</head>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
