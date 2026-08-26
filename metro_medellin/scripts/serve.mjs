/**
 * Servidor estático mínimo para probar la PWA en local (incluye el móvil, si
 * está en la misma red Wi-Fi).  Uso:  npm run serve
 *
 * Sirve dist/, exactamente lo mismo que se sube a Netlify: probar otra cosa
 * no serviría de nada. Generarlo antes con: npm run pwa
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  // normalize() colapsa los "..", evitando salir de la raíz del proyecto.
  const rel = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, rel);

  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      // Sin caché: durante el desarrollo el Service Worker ya confunde bastante.
      'Cache-Control': 'no-store',
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
});

server.listen(PORT, () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log(`\n  Metro Medellín\n`);
  console.log(`  local:  http://localhost:${PORT}`);
  for (const ip of lan) console.log(`  red:    http://${ip}:${PORT}`);
  console.log(
    `\n  Nota: la geolocalización del navegador requiere https o localhost.\n` +
      `  Desde el móvil por IP, Chrome/Safari bloquearán el GPS.\n`
  );
});
