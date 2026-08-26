/**
 * Valida data/*.json antes de inyectarlo en la app.  Uso: npm run data:check
 *
 * Sin esquema externo a propósito: son cuatro archivos y las reglas que
 * importan aquí son de integridad referencial, no de tipos.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cobertura, derive, loadDb } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

// Área metropolitana del Valle de Aburrá, con margen.
const BBOX = { latMin: 6.05, latMax: 6.45, lngMin: -75.75, lngMax: -75.4 };
const TRIESTADO = new Set([true, false, null]);
const TIPOS = new Set(['metro', 'cable', 'tranvia', 'bus']);
const ESTADOS = new Set(['operativa', 'en construcción', 'suspendida']);
const TIPOS_TRANSFERENCIA = new Set(['directa', 'peatonal']);

const errores = [];
const avisos = [];
const error = (msg) => errores.push(msg);
const aviso = (msg) => avisos.push(msg);

const db = loadDb(DATA);
const idsEstacion = new Set();

// ── Estaciones ───────────────────────────────────────────────────────────────
for (const e of db.estaciones) {
  const ref = `estación "${e.id}"`;

  if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) error(`${ref}: id inválido (solo a-z, 0-9 y guiones)`);
  if (idsEstacion.has(e.id)) error(`${ref}: id duplicado`);
  idsEstacion.add(e.id);

  if (!e.nombre?.trim()) error(`${ref}: falta nombre`);

  const { lat, lng } = e.coordenadas ?? {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    error(`${ref}: coordenadas ausentes o no numéricas`);
  } else if (lat < BBOX.latMin || lat > BBOX.latMax || lng < BBOX.lngMin || lng > BBOX.lngMax) {
    error(`${ref}: coordenadas fuera del Valle de Aburrá (${lat}, ${lng})`);
  }

  if (!TRIESTADO.has(e.integracionBuses)) {
    error(`${ref}: integracionBuses debe ser true, false o null`);
  }

  if (e.transferencia !== null && e.transferencia !== undefined) {
    if (!TIPOS_TRANSFERENCIA.has(e.transferencia.tipo)) {
      error(`${ref}: transferencia.tipo debe ser ${[...TIPOS_TRANSFERENCIA].join(' o ')}`);
    }
    if (e.transferencia.nota !== null && typeof e.transferencia.nota !== 'string') {
      error(`${ref}: transferencia.nota debe ser texto o null`);
    }
  }

  for (const [clave, valor] of Object.entries(e.servicios ?? {})) {
    if (!db.catalogo.servicios[clave]) {
      error(`${ref}: servicio desconocido "${clave}" (no está en services.json)`);
    }
    if (!TRIESTADO.has(valor)) {
      error(`${ref}: servicio "${clave}" = ${JSON.stringify(valor)}; debe ser true, false o null`);
    }
  }

  // Una estación con servicios declarados debería decir de dónde salieron.
  if (Object.keys(e.servicios ?? {}).length > 0 && !e.fuente) {
    aviso(`${ref}: declara servicios pero no tiene "fuente"`);
  }
  if (e.verificado && !e.fuente) {
    aviso(`${ref}: marcada como verificada pero sin "fuente"`);
  }
  if (e.actualizado && !/^\d{4}-\d{2}-\d{2}$/.test(e.actualizado)) {
    error(`${ref}: "actualizado" debe tener formato AAAA-MM-DD`);
  }
}

// colocadaCon debe ser simétrico y apuntar a estaciones existentes
for (const e of db.estaciones) {
  for (const otro of e.colocadaCon ?? []) {
    if (!idsEstacion.has(otro)) {
      error(`estación "${e.id}": colocadaCon apunta a "${otro}", que no existe`);
    } else {
      const inverso = db.estaciones.find((x) => x.id === otro);
      if (!inverso.colocadaCon?.includes(e.id)) {
        error(`colocadaCon no es simétrico: "${e.id}" → "${otro}" pero no al revés`);
      }
    }
  }
}

// ── Líneas ───────────────────────────────────────────────────────────────────
const idsLinea = new Set();
for (const l of db.lineas) {
  const ref = `línea "${l.nombre}"`;

  if (idsLinea.has(l.id)) error(`${ref}: id duplicado "${l.id}"`);
  idsLinea.add(l.id);

  if (!/^#[0-9a-f]{6}$/i.test(l.color ?? '')) error(`${ref}: color inválido "${l.color}"`);
  if (!TIPOS.has(l.tipo)) error(`${ref}: tipo "${l.tipo}" no es uno de ${[...TIPOS].join(', ')}`);
  if (!ESTADOS.has(l.estado)) error(`${ref}: estado "${l.estado}" no reconocido`);
  if (typeof l.bicicletaPermitida !== 'boolean') error(`${ref}: bicicletaPermitida debe ser booleano`);

  if (!Array.isArray(l.estaciones) || l.estaciones.length < 2) {
    error(`${ref}: debe listar al menos 2 estaciones`);
  }
  for (const id of l.estaciones ?? []) {
    if (!idsEstacion.has(id)) error(`${ref}: referencia a estación inexistente "${id}"`);
  }
  if (new Set(l.estaciones).size !== l.estaciones?.length) {
    error(`${ref}: tiene estaciones repetidas`);
  }

  // Solo las líneas en construcción pueden no tener horario.
  if (!l.horario && l.estado === 'operativa') {
    error(`${ref}: línea operativa sin horario`);
  }
  if (l.horario) {
    for (const franja of ['lunesASabado', 'domingosYFestivos']) {
      const h = l.horario[franja];
      if (!h?.apertura || !h?.cierre) {
        error(`${ref}: horario.${franja} incompleto`);
      } else if (!/^\d{2}:\d{2}$/.test(h.apertura) || !/^\d{2}:\d{2}$/.test(h.cierre)) {
        error(`${ref}: horario.${franja} debe usar formato HH:MM de 24 horas`);
      }
    }
  }
}

// Estaciones huérfanas: existen pero ninguna línea las sirve
const servidas = new Set(db.lineas.flatMap((l) => l.estaciones));
for (const id of idsEstacion) {
  if (!servidas.has(id)) error(`estación "${id}" no aparece en ninguna línea`);
}

// ── Tarifas ──────────────────────────────────────────────────────────────────
for (const t of db.tarifas.civica ?? []) {
  for (const campo of ['integraciones1a4', 'integraciones5a7']) {
    if (!Number.isInteger(t[campo]) || t[campo] <= 0) {
      error(`tarifa "${t.id}": ${campo} debe ser un entero positivo`);
    }
  }
  if (t.integraciones5a7 < t.integraciones1a4) {
    aviso(`tarifa "${t.id}": el tramo 5-7 es más barato que el de 1-4; ¿está bien?`);
  }
}
if (!db.tarifas.vigencia) error('fares.json: falta "vigencia"');

// ── Catálogo ─────────────────────────────────────────────────────────────────
for (const [clave, s] of Object.entries(db.catalogo.servicios)) {
  if (!db.catalogo.categorias[s.categoria]) {
    error(`servicio "${clave}": categoría desconocida "${s.categoria}"`);
  }
  if (!s.etiqueta || !s.icono) error(`servicio "${clave}": faltan etiqueta o icono`);
}

// ── Resultado ────────────────────────────────────────────────────────────────
const cob = cobertura(derive(db));

for (const a of avisos) console.warn(`  aviso  ${a}`);
for (const e of errores) console.error(`  ERROR  ${e}`);

console.log(
  `\n  ${db.estaciones.length} estaciones · ${db.lineas.length} líneas · ` +
    `${Object.keys(db.catalogo.servicios).length} servicios en el catálogo`
);
console.log(
  `  Cobertura: ${cob.conServicios}/${cob.total} estaciones con datos de servicios · ` +
    `${cob.verificadas}/${cob.total} verificadas`
);

if (errores.length) {
  console.error(`\n✗ ${errores.length} error(es) de validación\n`);
  process.exit(1);
}
console.log(`✓ Datos válidos${avisos.length ? ` (${avisos.length} aviso(s))` : ''}\n`);
