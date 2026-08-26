/**
 * Genera los dos artefactos SQL desde data/*.json.  Uso: npm run db:sql
 *
 *   supabase/seed.sql      solo datos, para el flujo con la CLI (`db:push`)
 *   supabase/instalar.sql  esquema + vistas + RLS + datos, en un solo archivo
 *
 * `instalar.sql` se arma concatenando las migraciones tal cual, así que no hay
 * dos versiones del esquema que puedan divergir: para cambiar algo se toca la
 * migración y se regenera.
 *
 * Ambos son re-ejecutables: las migraciones usan IF NOT EXISTS / DROP … IF
 * EXISTS y cada INSERT lleva ON CONFLICT DO UPDATE.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDb } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUPA = join(ROOT, 'supabase');
const db = loadDb(join(ROOT, 'data'));

// Prefijo de proyecto: la base es compartida con otros proyectos.
const PREFIJO = 'MetroMed_';

// ── Literales SQL ────────────────────────────────────────────────────────────
const lit = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};
const json = (v) => (v == null ? 'null' : `${lit(JSON.stringify(v))}::jsonb`);

/**
 * Un INSERT con todas las filas y un solo ON CONFLICT, en vez de una sentencia
 * por fila: el archivo pasa de ~100 KB a un tamaño que se puede pegar de golpe
 * en el editor SQL de Supabase.
 */
function insertar(tabla, columnas, filas, { conflicto, actualizar }) {
  if (!filas.length) return `-- ${PREFIJO}${tabla}: sin filas`;
  const set = (actualizar ?? columnas.filter((c) => !conflicto.includes(c)))
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return (
    `insert into public."${PREFIJO}${tabla}" (${columnas.join(', ')}) values\n` +
    filas.map((f) => `  (${f.join(', ')})`).join(',\n') +
    `\non conflict (${conflicto.join(', ')}) do update set\n  ${set};`
  );
}

const partes = [];
const seccion = (t) => partes.push(`\n-- ${'─'.repeat(74)}\n-- ${t}\n-- ${'─'.repeat(74)}`);

// ── Catálogo ─────────────────────────────────────────────────────────────────
seccion('Categorías de servicio');
partes.push(
  insertar(
    'categorias_servicio',
    ['clave', 'etiqueta', 'icono', 'orden'],
    Object.entries(db.catalogo.categorias).map(([k, c]) => [lit(k), lit(c.etiqueta), lit(c.icono), c.orden]),
    { conflicto: ['clave'] }
  )
);

seccion(`Catálogo de servicios (${Object.keys(db.catalogo.servicios).length})`);
partes.push(
  insertar(
    'servicios',
    ['clave', 'etiqueta', 'icono', 'categoria', 'descripcion'],
    Object.entries(db.catalogo.servicios).map(([k, s]) => [
      lit(k), lit(s.etiqueta), lit(s.icono), lit(s.categoria), lit(s.descripcion),
    ]),
    { conflicto: ['clave'] }
  )
);

// ── Estaciones ───────────────────────────────────────────────────────────────
seccion(`Estaciones (${db.estaciones.length})`);
partes.push(
  insertar(
    'estaciones',
    ['id', 'nombre', 'lat', 'lng', 'municipio', 'estructura', 'direccion',
      'transferencia', 'transferencia_nota', 'integracion_buses', 'notas',
      'verificado', 'fuente', 'actualizado'],
    db.estaciones.map((e) => [
      lit(e.id), lit(e.nombre), e.coordenadas.lat, e.coordenadas.lng, lit(e.municipio),
      lit(e.estructura), lit(e.direccion),
      e.transferencia ? `${lit(e.transferencia.tipo)}::public."${PREFIJO}tipo_transferencia"` : 'null',
      lit(e.transferencia?.nota ?? null), lit(e.integracionBuses), lit(e.notas),
      lit(e.verificado), lit(e.fuente), lit(e.actualizado),
    ]),
    { conflicto: ['id'] }
  )
);

// ── Líneas ───────────────────────────────────────────────────────────────────
seccion(`Líneas (${db.lineas.length})`);
partes.push(
  insertar(
    'lineas',
    ['id', 'nombre', 'color', 'tipo', 'tramo', 'estado', 'bicicleta_permitida',
      'tarifa', 'horario', 'orden'],
    db.lineas.map((l, i) => [
      lit(l.id), lit(l.nombre), lit(l.color), `${lit(l.tipo)}::public."${PREFIJO}tipo_linea"`,
      lit(l.tramo),
      `${lit(l.estado === 'en construcción' ? 'en_construccion' : l.estado)}::public."${PREFIJO}estado_linea"`,
      lit(l.bicicletaPermitida), `${lit(l.tarifa)}::public."${PREFIJO}modelo_tarifa"`,
      json(l.horario), i + 1,
    ]),
    { conflicto: ['id'] }
  )
);

// ── Recorridos ───────────────────────────────────────────────────────────────
// Se vacía primero: si una estación deja de pertenecer a una línea, el UPSERT
// por sí solo no la quitaría y quedaría un recorrido fantasma.
seccion('Recorrido de cada línea (define el trazado del mapa)');
partes.push(`delete from public."${PREFIJO}linea_estacion";`);
partes.push(
  insertar(
    'linea_estacion',
    ['linea_id', 'estacion_id', 'orden'],
    db.lineas.flatMap((l) => l.estaciones.map((id, i) => [lit(l.id), lit(id), i + 1])),
    { conflicto: ['linea_id', 'estacion_id'], actualizar: ['orden'] }
  )
);

// ── Co-ubicación ─────────────────────────────────────────────────────────────
seccion('Estaciones co-ubicadas');
partes.push(`delete from public."${PREFIJO}estaciones_colocadas";`);
const pares = [];
const vistos = new Set();
for (const e of db.estaciones) {
  for (const otro of e.colocadaCon ?? []) {
    const clave = [e.id, otro].sort().join('|');
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    pares.push([lit(e.id), lit(otro)]); // el trigger crea el sentido inverso
  }
}
partes.push(
  pares.length
    ? insertar('estaciones_colocadas', ['estacion_id', 'colocada_con_id'], pares, {
        conflicto: ['estacion_id', 'colocada_con_id'], actualizar: ['distancia_m'],
      })
    : '-- Ninguna: los pares del dataset original resultaron ser un artefacto de\n' +
      '-- coordenadas equivocadas (ver data/README.md).'
);

// ── Servicios por estación ───────────────────────────────────────────────────
const servicios = db.estaciones.flatMap((e) =>
  Object.entries(e.servicios ?? {})
    .filter(([, v]) => v !== null)
    .map(([clave, valor]) => [lit(e.id), lit(clave), lit(valor), lit(e.fuente), lit(e.actualizado)])
);
seccion(`Servicios confirmados (${servicios.length}) — la ausencia de fila significa "sin verificar"`);
partes.push(
  servicios.length
    ? insertar('estacion_servicio', ['estacion_id', 'servicio', 'disponible', 'fuente', 'actualizado'],
        servicios, { conflicto: ['estacion_id', 'servicio'] })
    : '-- (todavía sin servicios confirmados)'
);

// ── Tarifas ──────────────────────────────────────────────────────────────────
seccion(`Tarifas (vigencia ${db.tarifas.vigencia})`);
partes.push(
  insertar(
    'tarifas_civica',
    ['id', 'etiqueta', 'integraciones_1_4', 'integraciones_5_7', 'vigencia', 'orden'],
    db.tarifas.civica.map((t, i) => [
      lit(t.id), lit(t.etiqueta), t.integraciones1a4, t.integraciones5a7, lit(db.tarifas.vigencia), i + 1,
    ]),
    { conflicto: ['id'] }
  )
);

const especiales = Object.values(db.tarifas.especiales).flatMap((esp) =>
  esp.tarifas.map((t, i) => [
    lit(t.id), lit(esp.linea), lit(t.etiqueta), t.valor, lit(esp.nota ?? null), lit(db.tarifas.vigencia), i + 1,
  ])
);
partes.push(
  insertar('tarifas_especiales',
    ['id', 'linea_id', 'etiqueta', 'valor', 'nota', 'vigencia', 'orden'],
    especiales, { conflicto: ['id'] })
);

const DATOS = partes.join('\n');

// ── seed.sql ─────────────────────────────────────────────────────────────────
const cabeceraSeed = `-- Generado por scripts/build-sql.mjs · NO EDITAR A MANO.
-- Fuente: data/*.json · Regenerar con: npm run db:sql
--
-- Solo DATOS. El esquema está en supabase/migrations/.
-- Para instalar todo de una vez en una base vacía: supabase/instalar.sql
--
-- Re-ejecutable: cada INSERT lleva ON CONFLICT DO UPDATE.

begin;
set constraints all deferred;
`;
writeFileSync(join(SUPA, 'seed.sql'), `${cabeceraSeed}${DATOS}\n\ncommit;\n`, 'utf8');

// ── instalar.sql ─────────────────────────────────────────────────────────────
const migraciones = readdirSync(join(SUPA, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
const ESQUEMA = migraciones
  .map((f) => `\n-- ╔${'═'.repeat(74)}\n-- ║ migrations/${f}\n-- ╚${'═'.repeat(74)}\n\n` +
    readFileSync(join(SUPA, 'migrations', f), 'utf8').trimEnd())
  .join('\n');

const cobertura = {
  estaciones: db.estaciones.length,
  lineas: db.lineas.length,
  servicios: servicios.length,
  verificadas: db.estaciones.filter((e) => e.verificado).length,
};

const instalar = `-- ═══════════════════════════════════════════════════════════════════════════
-- METRO DE MEDELLÍN · instalación completa de la base de datos
--
-- Generado por scripts/build-sql.mjs · NO EDITAR A MANO.
-- Regenerar con: npm run db:sql
--
-- Crea el esquema entero y lo carga con los datos. Pensado para pegarlo en
-- Supabase → SQL Editor, sin necesidad de instalar la CLI. También sirve en
-- cualquier PostgreSQL 15+ (los roles anon/authenticated se crean si faltan).
--
--   ${String(cobertura.estaciones).padStart(3)} estaciones (${cobertura.verificadas} con coordenada verificada en OpenStreetMap)
--   ${String(cobertura.lineas).padStart(3)} líneas
--   ${String(cobertura.servicios).padStart(3)} servicios confirmados
--
-- SE PUEDE EJECUTAR VARIAS VECES: crea lo que falte y actualiza los datos.
-- No borra nada salvo los recorridos de línea y las co-ubicaciones, que se
-- reconstruyen enteros para que no queden restos de una versión anterior.
--
-- ── Empezar de cero ────────────────────────────────────────────────────────
-- Este archivo NO altera tablas que ya existan con otra forma. Si vienes de
-- una versión anterior del esquema y quieres reinstalar desde cero, ejecuta
-- antes esto (BORRA TODOS LOS DATOS):
--
--   drop table if exists
--     public."${PREFIJO}estacion_servicio", public."${PREFIJO}estaciones_colocadas",
--     public."${PREFIJO}linea_estacion", public."${PREFIJO}tarifas_especiales",
--     public."${PREFIJO}tarifas_civica", public."${PREFIJO}estaciones",
--     public."${PREFIJO}lineas", public."${PREFIJO}servicios",
--     public."${PREFIJO}categorias_servicio" cascade;
--   drop type if exists
--     public."${PREFIJO}tipo_linea", public."${PREFIJO}estado_linea",
--     public."${PREFIJO}modelo_tarifa", public."${PREFIJO}tipo_transferencia" cascade;
--
-- ═══════════════════════════════════════════════════════════════════════════

begin;
${ESQUEMA}


-- ╔${'═'.repeat(74)}
-- ║ DATOS
-- ╚${'═'.repeat(74)}

set constraints all deferred;
${DATOS}

commit;


-- ── Comprobación ───────────────────────────────────────────────────────────
-- Debe devolver: ${cobertura.estaciones} estaciones · ${cobertura.lineas} líneas · ${cobertura.servicios} servicios
select
  (select count(*) from public."${PREFIJO}estaciones")        as estaciones,
  (select count(*) from public."${PREFIJO}lineas")            as lineas,
  (select count(*) from public."${PREFIJO}estacion_servicio") as servicios_confirmados,
  (select count(*) from public."${PREFIJO}estaciones" where verificado) as verificadas;
`;

writeFileSync(join(SUPA, 'instalar.sql'), instalar, 'utf8');

const kb = (s) => (s.length / 1024).toFixed(0) + ' KB';
console.log(
  `✓ supabase/seed.sql      ${kb(DATOS)}  (solo datos)\n` +
    `✓ supabase/instalar.sql  ${kb(instalar)}  (esquema + datos, autónomo)\n` +
    `  ${cobertura.estaciones} estaciones · ${cobertura.lineas} líneas · ${cobertura.servicios} servicios confirmados`
);
