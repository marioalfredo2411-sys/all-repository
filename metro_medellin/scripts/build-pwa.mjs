/**
 * Ensambla dist/, la carpeta que se despliega como PWA.  Uso: npm run pwa
 *
 * Antes «desplegar» era arrastrar la raíz del proyecto a Netlify Drop. Eso hoy
 * subiría 200 MB de node_modules, los proyectos android/ e ios/, las
 * migraciones de Supabase y —lo importante— el archivo .env. dist/ contiene
 * exactamente lo que el navegador necesita y nada más.
 *
 * Genera además dist/sw.js desde src/sw.js, con la lista de precache real y
 * una versión derivada del contenido: cada despliegue invalida el caché
 * anterior sin que haya que acordarse de subir un número a mano.
 */
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Lo que se copia tal cual. Todo lo demás se queda fuera a propósito.
const ARCHIVOS = [
  'index.html', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'MetroMed01.png', 'MetroMed02.png',
];
const CARPETAS = ['vendor', 'icons'];

// Lo que se precachea para que la app arranque sin red. Las capturas de las
// tiendas y los splash de iOS no: pesan y no hacen falta para funcionar.
const PRECACHEAR = (rel) =>
  rel === 'index.html' || rel === 'manifest.json' ||
  rel.startsWith('vendor/') ||
  /^icon-(192|512)\.png$/.test(rel) || rel === 'apple-touch-icon.png';

async function listar(dir, base = dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...await listar(ruta, base));
    else salida.push(relative(base, ruta).split(sep).join(posix.sep));
  }
  return salida;
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const f of ARCHIVOS) {
  await cp(join(ROOT, f), join(DIST, f)).catch(() => {
    console.warn(`  aviso  falta ${f}, se omite`);
  });
}
for (const d of CARPETAS) {
  await cp(join(ROOT, d), join(DIST, d), { recursive: true }).catch(() => {
    console.warn(`  aviso  falta la carpeta ${d}, se omite`);
  });
}

// ── Service Worker ──────────────────────────────────────────────────────────
const todos = await listar(DIST);
const precache = todos.filter(PRECACHEAR).sort();

// La versión sale del contenido de lo precacheado: si nada cambió, el hash es
// el mismo y los navegadores no reinstalan nada.
const hash = createHash('sha256');
for (const rel of precache) hash.update(await readFile(join(DIST, rel)));
const version = hash.digest('hex').slice(0, 12);

const plantilla = await readFile(join(ROOT, 'src', 'sw.js'), 'utf8');
await writeFile(
  join(DIST, 'sw.js'),
  plantilla
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(['./', ...precache.map((f) => './' + f)], null, 2)),
  'utf8'
);

// ── Cabeceras para Netlify ──────────────────────────────────────────────────
// sw.js NUNCA debe cachearse: es lo que descubre que hay una versión nueva.
await writeFile(join(DIST, '_headers'), `/sw.js
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/vendor/*
  Cache-Control: public, max-age=31536000, immutable
`, 'utf8');

// SPA de una sola página: cualquier ruta sirve index.html.
await writeFile(join(DIST, '_redirects'), '/*  /index.html  200\n', 'utf8');

// ── Informe ─────────────────────────────────────────────────────────────────
const finales = await listar(DIST);
let peso = 0;
for (const f of finales) peso += (await stat(join(DIST, f))).size;

console.log(
  `\n✓ dist/ · ${finales.length} archivos · ${(peso / 1024 / 1024).toFixed(2)} MB\n` +
    `  precache: ${precache.length + 1} recursos (arranque sin red)\n` +
    `  versión del SW: ${version}\n\n` +
    `  Desplegar: arrastra la carpeta dist/ a app.netlify.com/drop\n`
);
