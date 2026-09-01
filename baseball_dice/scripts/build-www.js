/*
 * Copia el sitio PWA a ./www, que es el `webDir` que usa Capacitor
 * para generar los proyectos nativos de Android (APK) e iOS (IPA).
 *
 *   node scripts/build-www.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

const INCLUDE = [
  'index.html',
  'baseball-dice.html',
  'manifest.webmanifest',
  'sw.js',
  'favicon.ico',
  'icons',
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const entry of INCLUDE) {
  const src = path.join(root, entry);
  if (!fs.existsSync(src)) {
    console.warn(`  (omitido, no existe) ${entry}`);
    continue;
  }
  fs.cpSync(src, path.join(out, entry), { recursive: true });
  console.log(`  copiado  ${entry}`);
}

console.log(`\nwww/ listo en ${out}`);
