/**
 * Inyecta data/*.json dentro de index.html.  Uso: npm run data:build
 *
 * ¿Por qué generar en vez de hacer fetch en tiempo de ejecución?
 * La app dibuja el mapa inmediatamente con datos locales y solo después
 * consulta Overpass. Cargar las estaciones por red rompería ese arranque y
 * añadiría un modo de fallo en la primera visita de la PWA. Así index.html
 * sigue siendo autónomo y offline, y `data/` sigue siendo la fuente de verdad.
 *
 * Además de DB, se generan `LINES` y `STATIONS` con la MISMA forma que tenían
 * escritos a mano, de modo que el código del mapa no cambia.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive, loadDb } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(ROOT, 'index.html');
const INICIO = '/* DB:START */';
const FIN = '/* DB:END */';

const db = derive(loadDb(join(ROOT, 'data')));


// Credenciales públicas de Supabase, para que el botón «¿Ubicación
// incorrecta?» pueda enviar la propuesta. La clave anon viaja en el bundle
// por diseño y solo puede INSERTAR en MetroMed_correcciones.
// Si no hay .env, la app se queda con localStorage y no falla.
function credenciales() {
  let env;
  try {
    env = readFileSync(join(ROOT, '.env'), 'utf8');
  } catch {
    return { url: null, clave: null };  // sin .env la app usa solo localStorage
  }

  const valores = {};
  for (const linea of env.split(String.fromCharCode(10))) {
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    const corte = linea.indexOf('=');
    if (corte === -1) continue;
    valores[linea.slice(0, corte).trim()] =
      linea.slice(corte + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { url: valores.SUPABASE_URL ?? null, clave: valores.SUPABASE_ANON_KEY ?? null };
}

const SUPABASE = credenciales();
// ── Formateadores ────────────────────────────────────────────────────────────
const pesos = (n) => '$' + n.toLocaleString('es-CO');

/** "04:30" → "4:30am" · "23:00" → "11:00pm" */
function hora12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${sufijo}`;
}

function horarioTexto(linea) {
  if (!linea.horario) return linea.estado === 'en construcción' ? 'Próximamente' : '—';
  const { lunesASabado: ls, domingosYFestivos: df, noOpera } = linea.horario;
  const partes = [
    `Lun-Sáb ${hora12(ls.apertura)}–${hora12(ls.cierre)}`,
    `Dom/Fest ${hora12(df.apertura)}–${hora12(df.cierre)}`,
  ];
  if (noOpera?.length) partes.push(`⚠️ No opera ${noOpera.join(', ')}`);
  return partes.join(' · ');
}

function tarifaTexto(linea, tarifas) {
  if (linea.estado === 'en construcción') return 'Próximamente';

  if (linea.tarifa === 'especial') {
    const especial = Object.values(tarifas.especiales).find((e) => e.linea === linea.id);
    if (especial) return especial.tarifas.map((t) => `${t.etiqueta}: ${pesos(t.valor)}`).join(' · ');
  }

  const frecuente = tarifas.civica.find((t) => t.id === 'frecuente');
  const portador = tarifas.civica.find((t) => t.id === 'alPortador');
  return `${pesos(frecuente.integraciones1a4)} frecuente · ${pesos(portador.integraciones1a4)} al portador`;
}

// ── Serialización ────────────────────────────────────────────────────────────
// Un objeto por línea: el bloque generado queda compacto pero con diffs legibles.
const filas = (arr) => arr.map((o) => '    ' + JSON.stringify(o)).join(',\n');

const estacionesPorId = Object.fromEntries(db.estaciones.map((e) => [e.id, e]));

const lineasSalida = db.lineas.map((l) => [
  l.nombre,
  {
    color: l.color,
    type: l.tipo,
    tramo: l.tramo + (l.estado === 'en construcción' ? ' (en construcción)' : ''),
    horario: horarioTexto(l),
    tarifa: tarifaTexto(l, db.tarifas),
    bici: l.bicicletaPermitida,
    estado: l.estado,
  },
]);

// STATIONS conserva un registro por (estación × línea) porque drawLines() lo
// recorre en orden para trazar cada ruta.
const stationsSalida = db.lineas.flatMap((l) =>
  l.estaciones.map((id) => {
    const e = estacionesPorId[id];
    return {
      id: e.id,
      name: e.nombre,
      line: l.nombre,
      lat: e.coordenadas.lat,
      lng: e.coordenadas.lng,
      interchange: e.transbordo,
    };
  })
);

const bloque = `${INICIO}
// Generado por scripts/build-data.mjs · NO EDITAR A MANO.
// Fuente: data/lines.json, data/stations.json, data/services.json, data/fares.json
// Regenerar con: npm run data:build
const DB = {
  catalogo: ${JSON.stringify(db.catalogo, null, 2).split('\n').join('\n  ')},
  tarifas: ${JSON.stringify(db.tarifas, null, 2).split('\n').join('\n  ')},
  lineas: [
${filas(db.lineas)}
  ],
  estaciones: [
${filas(db.estaciones)}
  ],
};

DB.supabase = ${JSON.stringify(SUPABASE)};

DB.estacionPorId = Object.fromEntries(DB.estaciones.map(e => [e.id, e]));
DB.lineaPorNombre = Object.fromEntries(DB.lineas.map(l => [l.nombre, l]));

// Vistas con la forma que espera el código del mapa.
const LINES = {
${lineasSalida.map(([nombre, v]) => `  ${JSON.stringify(nombre)}: ${JSON.stringify(v)},`).join('\n')}
};

const STATIONS = [
${filas(stationsSalida)}
];
${FIN}`;

// ── Inyección ────────────────────────────────────────────────────────────────
const html = readFileSync(HTML, 'utf8');
const desde = html.indexOf(INICIO);
const hasta = html.indexOf(FIN);

if (desde === -1 || hasta === -1) {
  console.error(
    `✗ No encontré los marcadores ${INICIO} … ${FIN} en index.html.\n` +
      '  Deben rodear el bloque de datos generado.'
  );
  process.exit(1);
}

const salida = html.slice(0, desde) + bloque + html.slice(hasta + FIN.length);

if (salida === html) {
  console.log('✓ index.html ya está al día');
} else {
  writeFileSync(HTML, salida, 'utf8');
  console.log(
    `✓ index.html actualizado · ${db.estaciones.length} estaciones, ` +
      `${db.lineas.length} líneas, ${stationsSalida.length} registros estación×línea`
  );
}
