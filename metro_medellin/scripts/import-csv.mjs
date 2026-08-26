/**
 * Importa un CSV de servicios de estación a data/stations.json.
 *
 *   node scripts/import-csv.mjs <archivo.csv> --fuente "de dónde salió" [--aplicar]
 *
 * Sin --aplicar hace una pasada en seco y solo informa qué cambiaría.
 *
 * Deliberadamente NO importa coordenadas. Las del proyecto están validadas
 * contra la longitud publicada de las líneas; un CSV de servicios no es fuente
 * fiable de geometría. Si hay que corregir una posición, se usa el botón
 * "¿Ubicación incorrecta?" de la app o se edita stations.json a mano.
 *
 * Columnas reconocidas (el resto se ignora con aviso):
 *   Estación                 → se resuelve al id de la estación
 *   Transferencia            → transferencia.tipo + transferencia.nota
 *   Ruta Integrada           → servicio rutasIntegradas
 *   Parq. Bici               → servicio parqueaderoBicicletas
 *   PAC                      → servicio puntoAtencionCliente
 *   EnCicla                  → servicio encicla
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Columna del CSV → clave del catálogo de servicios.
const COLUMNA_A_SERVICIO = {
  'Ruta Integrada': 'rutasIntegradas',
  'Parq. Bici': 'parqueaderoBicicletas',
  PAC: 'puntoAtencionCliente',
  EnCicla: 'encicla',
};
const IGNORADAS = new Set(['Estación', 'Línea', 'Tipo', 'Latitud', 'Longitud', 'Transferencia']);

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Parser CSV mínimo: comillas dobles y comas dentro de campo. */
function parseCsv(texto) {
  const filas = [];
  for (const linea of texto.trim().split(/\r?\n/)) {
    const campos = [];
    let actual = '';
    let entreComillas = false;
    for (const ch of linea) {
      if (ch === '"') entreComillas = !entreComillas;
      else if (ch === ',' && !entreComillas) { campos.push(actual.trim()); actual = ''; }
      else actual += ch;
    }
    campos.push(actual.trim());
    filas.push(campos);
  }
  const [cabecera, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cabecera.map((c, i) => [c, f[i] ?? ''])));
}

const siNo = (v) => {
  const t = v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (t === 'si') return true;
  if (t === 'no') return false;
  return undefined; // vacío o valor raro → sin verificar
};

/** "Directa (Líneas K, P)" → { tipo:'directa', nota:'Líneas K, P' } */
function parseTransferencia(v) {
  if (!v || siNo(v) === false) return null;
  const m = /^(\w+)\s*(?:\((.*)\))?$/u.exec(v.trim());
  if (!m) return null;
  const tipo = m[1].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (tipo !== 'directa' && tipo !== 'peatonal') return null;
  return { tipo, nota: m[2]?.trim() || null };
}

// ── Argumentos ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--'));
const aplicar = args.includes('--aplicar');
const fuente = args[args.indexOf('--fuente') + 1];

if (!archivo || !args.includes('--fuente')) {
  console.error('Uso: node scripts/import-csv.mjs <archivo.csv> --fuente "origen" [--aplicar]');
  process.exit(1);
}

const catalogo = JSON.parse(readFileSync(join(ROOT, 'data/services.json'), 'utf8'));
const doc = JSON.parse(readFileSync(join(ROOT, 'data/stations.json'), 'utf8'));
const porId = new Map(doc.estaciones.map((e) => [e.id, e]));
const filas = parseCsv(readFileSync(archivo, 'utf8'));

// Valida las columnas antes de tocar nada.
const columnas = Object.keys(filas[0] ?? {});
for (const c of columnas) {
  if (IGNORADAS.has(c)) continue;
  if (!COLUMNA_A_SERVICIO[c]) console.warn(`  aviso  columna sin mapeo, se ignora: "${c}"`);
  else if (!catalogo.servicios[COLUMNA_A_SERVICIO[c]])
    throw new Error(`La columna "${c}" apunta a "${COLUMNA_A_SERVICIO[c]}", que no está en services.json`);
}

const hoy = new Date().toISOString().slice(0, 10);
const cambios = [];
const noEncontradas = [];
const conflictos = [];

for (const fila of filas) {
  const nombre = fila['Estación'];
  const est = porId.get(slug(nombre));
  if (!est) { noEncontradas.push(nombre); continue; }

  const antes = JSON.stringify({ s: est.servicios, t: est.transferencia ?? null });
  const servicios = { ...est.servicios };

  for (const [columna, clave] of Object.entries(COLUMNA_A_SERVICIO)) {
    const valor = siNo(fila[columna] ?? '');
    if (valor === undefined) continue;
    if (servicios[clave] !== undefined && servicios[clave] !== valor) {
      conflictos.push(`${est.id}.${clave}: ${servicios[clave]} → ${valor}`);
    }
    servicios[clave] = valor;
  }

  est.servicios = servicios;
  est.transferencia = parseTransferencia(fila['Transferencia'] ?? '');
  est.fuente = fuente;
  est.actualizado = hoy;

  if (JSON.stringify({ s: est.servicios, t: est.transferencia }) !== antes) {
    cambios.push(est.id);
  }
}

// Las estaciones no tocadas también necesitan el campo, para que el esquema
// sea uniforme y el validador pueda exigirlo.
for (const e of doc.estaciones) {
  if (e.transferencia === undefined) e.transferencia = null;
}

console.log(`\n  ${filas.length} filas leídas · ${cambios.length} estaciones actualizadas`);
if (noEncontradas.length) {
  console.log(`\n  No están en la base de datos (${noEncontradas.length}):`);
  for (const n of noEncontradas) console.log(`    - ${n}`);
}
if (conflictos.length) {
  console.log(`\n  Valores que cambian respecto a lo ya registrado (${conflictos.length}):`);
  for (const c of conflictos) console.log(`    - ${c}`);
}

if (!aplicar) {
  console.log('\n  Pasada en seco. Añade --aplicar para escribir data/stations.json\n');
  process.exit(0);
}

writeFileSync(join(ROOT, 'data/stations.json'), JSON.stringify(doc, null, 2) + '\n');
console.log(`\n✓ data/stations.json actualizado · fuente: "${fuente}"\n`);
