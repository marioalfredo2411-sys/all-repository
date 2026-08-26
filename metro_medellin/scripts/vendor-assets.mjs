/**
 * Descarga Leaflet y las tipografías a vendor/, para que la app no dependa de
 * ningún CDN.  Uso: npm run vendor
 *
 * Motivo: hasta ahora Leaflet venía de cdnjs y Barlow de Google Fonts. Sin red
 * no había mapa —ni en la PWA ni en las apps nativas, que también los cargaban
 * por internet—. Una app de metro que no arranca en el metro no sirve.
 *
 * Solo hay que ejecutarlo al cambiar de versión; vendor/ se versiona con el
 * proyecto para que un clon no necesite red para construir.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = join(ROOT, 'vendor');
const LEAFLET = '1.9.4';

// Sin User-Agent de navegador, Google Fonts devuelve formatos antiguos (ttf)
// en vez de woff2, que pesa la mitad.
const UA_NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

async function bajar(url, destino, cabeceras = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA_NAVEGADOR, ...cabeceras } });
  if (!r.ok) throw new Error(`${r.status} al bajar ${url}`);
  const datos = Buffer.from(await r.arrayBuffer());
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, datos);
  return datos;
}

const kb = (n) => (n / 1024).toFixed(0) + ' KB';

// ── Leaflet ─────────────────────────────────────────────────────────────────
console.log('  Leaflet ' + LEAFLET);
const base = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET}`;

for (const archivo of ['leaflet.min.js', 'leaflet.min.css']) {
  const d = await bajar(`${base}/${archivo}`, join(VENDOR, 'leaflet', archivo));
  console.log(`    ${archivo.padEnd(20)} ${kb(d.length)}`);
}

// El CSS referencia estas imágenes con rutas relativas a images/
for (const img of [
  'marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png', 'layers.png', 'layers-2x.png',
]) {
  try {
    const d = await bajar(`${base}/images/${img}`, join(VENDOR, 'leaflet', 'images', img));
    console.log(`    images/${img.padEnd(13)} ${kb(d.length)}`);
  } catch {
    console.log(`    images/${img.padEnd(13)} (no existe, se omite)`);
  }
}

// ── Tipografías ─────────────────────────────────────────────────────────────
console.log('\n  Barlow / Barlow Condensed');
const CSS_FUENTES =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900' +
  '&family=Barlow:wght@300;400;500&display=swap';

const css = await (await fetch(CSS_FUENTES, { headers: { 'User-Agent': UA_NAVEGADOR } })).text();

// Reescribe cada URL remota por el archivo local equivalente.
const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];
let cssLocal = css;
let total = 0;
const vistos = new Set();

for (const [, url] of urls) {
  const nombre = url.split('/').slice(-3).join('-');   // familia-hash-archivo.woff2
  if (!vistos.has(nombre)) {
    const d = await bajar(url, join(VENDOR, 'fonts', nombre));
    total += d.length;
    vistos.add(nombre);
  }
  cssLocal = cssLocal.split(url).join(`fonts/${nombre}`);
}

await writeFile(join(VENDOR, 'fonts.css'), cssLocal, 'utf8');
console.log(`    ${vistos.size} archivos woff2 · ${kb(total)}`);
console.log(`    fonts.css reescrito a rutas locales`);

console.log('\n✓ vendor/ listo — la app ya no depende de ningún CDN\n');
