/**
 * Trae el dataset desde Supabase y reescribe data/*.json.  Uso: npm run db:pull
 *
 * Requiere estas variables de entorno (o un archivo .env en la raíz):
 *   SUPABASE_URL       https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  la clave anon del proyecto
 *
 * Sin dependencias: es una sola llamada RPC a exportar_dataset(), que ya
 * devuelve el JSON con la forma de los archivos. La clave anon basta porque
 * la política de RLS da lectura pública.
 *
 * Después de traer los datos hay que ejecutar `npm run data:build` para
 * inyectarlos en index.html (o directamente `npm run build`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

// .env sin dependencias: solo CLAVE=valor, ignorando comentarios.
try {
  for (const linea of readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linea);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* sin .env: se usan las variables del entorno */
}

const URL_BASE = process.env.SUPABASE_URL;
const CLAVE = process.env.SUPABASE_ANON_KEY;

if (!URL_BASE || !CLAVE) {
  console.error(
    '✗ Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY.\n' +
      '  Ponlas en un archivo .env en la raíz (está en .gitignore) o en el entorno.\n' +
      '  Se encuentran en Supabase → Project Settings → API.'
  );
  process.exit(1);
}

const respuesta = await fetch(`${URL_BASE.replace(/\/$/, '')}/rest/v1/rpc/MetroMed_exportar_dataset`, {
  method: 'POST',
  headers: {
    apikey: CLAVE,
    Authorization: `Bearer ${CLAVE}`,
    'Content-Type': 'application/json',
    // Algunas redes y proxies rechazan peticiones sin User-Agent identificable.
    'User-Agent': 'metro-medellin-app/1.0 (sincronizacion de datos)',
  },
  body: '{}',
});

if (!respuesta.ok) {
  console.error(`✗ Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
  process.exit(1);
}

const datos = await respuesta.json();

if (!datos?.estaciones?.length || !datos?.lineas?.length) {
  console.error('✗ La respuesta no trae estaciones o líneas. ¿Se aplicó el seed?');
  process.exit(1);
}

// Campos que no viven en la base de datos (comentarios, moneda, fuente) se
// conservan de los archivos actuales en vez de perderse en cada pull.
const actual = (archivo) => {
  try {
    return JSON.parse(readFileSync(join(DATA, archivo), 'utf8'));
  } catch {
    return {};
  }
};

// PostgreSQL no conserva el orden de las claves de un jsonb, así que sin
// normalizar aquí cada `db:pull` reescribiría los archivos enteros con las
// claves barajadas: un diff de 70 estaciones aunque no cambie ningún dato.
const ordenar = (obj, orden) => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const salida = {};
  for (const k of orden) if (k in obj) salida[k] = obj[k];
  // Lo que no esté en la lista va detrás, alfabético, para no perderlo nunca.
  for (const k of Object.keys(obj).sort()) if (!(k in salida)) salida[k] = obj[k];
  return salida;
};

const ORDEN_ESTACION = ['id', 'nombre', 'coordenadas', 'municipio', 'estructura',
  'direccion', 'colocadaCon', 'integracionBuses', 'servicios', 'horarioEspecial',
  'notas', 'verificado', 'fuente', 'actualizado', 'transferencia'];
const ORDEN_LINEA = ['id', 'nombre', 'color', 'tipo', 'tramo', 'estado',
  'bicicletaPermitida', 'tarifa', 'horario', 'estaciones'];
const ORDEN_SERVICIO = ['etiqueta', 'icono', 'categoria', 'descripcion'];
const ORDEN_CATEGORIA = ['etiqueta', 'icono', 'orden'];

/** Un mapa clave→objeto con las claves alfabéticas y cada valor ordenado. */
const ordenarMapa = (mapa, orden) =>
  Object.fromEntries(Object.keys(mapa ?? {}).sort().map((k) => [k, ordenar(mapa[k], orden)]));

const escribir = (archivo, contenido) => {
  writeFileSync(join(DATA, archivo), JSON.stringify(contenido, null, 2) + '\n', 'utf8');
};

const lineasPrevio = actual('lines.json');
const estacionesPrevio = actual('stations.json');
const serviciosPrevio = actual('services.json');
const tarifasPrevio = actual('fares.json');

escribir('lines.json', {
  version: lineasPrevio.version ?? 1,
  lineas: datos.lineas.map((l) => ordenar(l, ORDEN_LINEA)),
});
escribir('stations.json', {
  version: estacionesPrevio.version ?? 1,
  estaciones: datos.estaciones.map((e) => ({
    ...ordenar(e, ORDEN_ESTACION),
    servicios: Object.fromEntries(Object.entries(e.servicios ?? {}).sort()),
  })),
});
escribir('services.json', {
  version: serviciosPrevio.version ?? 1,
  _comentario: serviciosPrevio._comentario,
  categorias: ordenarMapa(datos.servicios.categorias, ORDEN_CATEGORIA),
  servicios: ordenarMapa(datos.servicios.servicios, ORDEN_SERVICIO),
});
escribir('fares.json', {
  version: tarifasPrevio.version ?? 1,
  vigencia: datos.tarifas.vigencia,
  moneda: tarifasPrevio.moneda ?? 'COP',
  fuente: tarifasPrevio.fuente ?? null,
  actualizado: tarifasPrevio.actualizado ?? null,
  _comentario: tarifasPrevio._comentario,
  civica: datos.tarifas.civica,
  especiales: ordenarMapa(datos.tarifas.especiales, ['linea', 'etiqueta', 'nota', 'tarifas']),
});

const conServicios = datos.estaciones.filter(
  (e) => Object.keys(e.servicios ?? {}).length > 0
).length;

console.log(
  `✓ data/ actualizado desde Supabase\n` +
    `  ${datos.estaciones.length} estaciones · ${datos.lineas.length} líneas · ` +
    `${conServicios} con datos de servicios\n\n` +
    `  Siguiente paso:  npm run build\n`
);
