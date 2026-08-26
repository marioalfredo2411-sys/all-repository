/**
 * Ejecuta las migraciones y el seed contra un PostgreSQL real (PGlite, en
 * memoria) y comprueba que el resultado coincide con data/*.json.
 *
 *   npm run db:test
 *
 * No hace falta Docker ni una instancia de Supabase: PGlite es el propio
 * Postgres compilado a WebAssembly. Lo único que no cubre es lo específico de
 * Supabase (roles anon/authenticated y GoTrue), que el arranque simula.
 */
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive, loadDb } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUPA = join(ROOT, 'supabase');

let fallos = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const mal = (m) => { console.error(`  ✗ ${m}`); fallos++; };
const comparar = (etiqueta, real, esperado) =>
  real === esperado ? ok(`${etiqueta}: ${real}`) : mal(`${etiqueta}: ${real}, se esperaba ${esperado}`);

// Los errores de PGlite arrastran el bundle entero en el stack; solo interesa
// el mensaje de PostgreSQL.
process.on('uncaughtException', (e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});

// ── instalar.sql sobre una base virgen ───────────────────────────────────────
// Es el camino real del usuario: pegar un archivo en el editor SQL de Supabase.
// A propósito NO se crean los roles anon/authenticated antes: el propio script
// debe crearlos si faltan.
console.log('\n  INSTALACIÓN COMPLETA (supabase/instalar.sql en base vacía)');
const db = new PGlite();
const instalar = readFileSync(join(SUPA, 'instalar.sql'), 'utf8');

try {
  await db.exec(instalar);
  ok(`instalar.sql sobre base vacía (${(instalar.length / 1024).toFixed(0)} KB)`);
} catch (e) {
  mal(`instalar.sql → ${e.message}`);
  process.exit(1);
}

try {
  await db.exec(instalar);
  ok('instalar.sql es re-ejecutable (aplicado dos veces)');
} catch (e) {
  mal(`segunda pasada de instalar.sql → ${e.message}`);
}

// Que no haya duplicado nada al repetirse.
const trasDoble = Number((await db.query('select count(*) n from "MetroMed_estaciones"')).rows[0].n);
const esperadoEst = derive(loadDb(join(ROOT, 'data'))).estaciones.length;
comparar('sin duplicados tras la segunda pasada', trasDoble, esperadoEst);

// ── El otro camino: migraciones + seed con la CLI ────────────────────────────
console.log('\n  FLUJO CON LA CLI (migrations/ + seed.sql)');
const cli = new PGlite();
await cli.exec(`create role anon nologin; create role authenticated nologin;`);
const migraciones = readdirSync(join(SUPA, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
try {
  for (const f of migraciones) await cli.exec(readFileSync(join(SUPA, 'migrations', f), 'utf8'));
  await cli.exec(readFileSync(join(SUPA, 'seed.sql'), 'utf8'));
  const n = Number((await cli.query('select count(*) n from "MetroMed_estaciones"')).rows[0].n);
  comparar(`${migraciones.length} migraciones + seed.sql`, n, esperadoEst);
} catch (e) {
  mal(`flujo CLI → ${e.message}`);
}
await cli.close();

// ── Recuentos contra los JSON ────────────────────────────────────────────────
console.log('\n  RECUENTOS');
const esperado = derive(loadDb(join(ROOT, 'data')));
const uno = async (sql) => Number((await db.query(sql)).rows[0].n);

comparar('estaciones', await uno('select count(*) n from "MetroMed_estaciones"'), esperado.estaciones.length);
comparar('líneas', await uno('select count(*) n from "MetroMed_lineas"'), esperado.lineas.length);
comparar(
  'servicios en catálogo',
  await uno('select count(*) n from "MetroMed_servicios"'),
  Object.keys(esperado.catalogo.servicios).length
);
comparar(
  'registros estación×línea',
  await uno('select count(*) n from "MetroMed_linea_estacion"'),
  esperado.lineas.reduce((t, l) => t + l.estaciones.length, 0)
);
comparar(
  'servicios confirmados',
  await uno('select count(*) n from "MetroMed_estacion_servicio"'),
  esperado.estaciones.reduce(
    (t, e) => t + Object.values(e.servicios ?? {}).filter((v) => v !== null).length, 0)
);

// ── Reglas de integridad ─────────────────────────────────────────────────────
console.log('\n  RESTRICCIONES (deben rechazar)');
const debeFallar = async (etiqueta, sql) => {
  try {
    await db.exec(`savepoint s; ${sql}; release savepoint s;`);
    mal(`${etiqueta}: se aceptó y no debía`);
  } catch {
    await db.exec('rollback to savepoint s; release savepoint s;').catch(() => {});
    ok(etiqueta);
  }
};

await debeFallar('coordenadas fuera del Valle de Aburrá',
  `insert into "MetroMed_estaciones" (id, nombre, lat, lng) values ('x1','X',40.4,-3.7)`);
await debeFallar('id con mayúsculas o espacios',
  `insert into "MetroMed_estaciones" (id, nombre, lat, lng) values ('Mal Id','X',6.24,-75.57)`);
await debeFallar('verificado sin fuente',
  `insert into "MetroMed_estaciones" (id, nombre, lat, lng, verificado) values ('x2','X',6.24,-75.57,true)`);
await debeFallar('color de línea inválido',
  `insert into "MetroMed_lineas" (id,nombre,color,tipo,tramo,bicicleta_permitida,horario,orden)
   values ('Z','Línea Z','azul','metro','A ↔ B',true,'{}'::jsonb,99)`);
await debeFallar('línea operativa sin horario',
  `insert into "MetroMed_lineas" (id,nombre,color,tipo,tramo,bicicleta_permitida,orden)
   values ('Z','Línea Z','#112233','metro','A ↔ B',true,99)`);
await debeFallar('servicio inexistente en una estación',
  `insert into "MetroMed_estacion_servicio" (estacion_id,servicio,disponible)
   values ('acevedo','teletransportador',true)`);
await debeFallar('dos estaciones en la misma posición de una línea',
  `insert into "MetroMed_linea_estacion" (linea_id,estacion_id,orden) values ('A','arvi',1)`);
await debeFallar('nota de transferencia sin tipo',
  `insert into "MetroMed_estaciones" (id,nombre,lat,lng,transferencia_nota)
   values ('x3','X',6.24,-75.57,'algo')`);
await debeFallar('estación co-ubicada consigo misma',
  `insert into "MetroMed_estaciones_colocadas" (estacion_id,colocada_con_id) values ('acevedo','acevedo')`);
await debeFallar('tarifa negativa',
  `insert into "MetroMed_tarifas_civica" (id,etiqueta,integraciones_1_4,integraciones_5_7,vigencia,orden)
   values ('x','X',-1,100,'2026',99)`);

// ── Triggers y derivaciones ──────────────────────────────────────────────────
console.log('\n  TRIGGERS Y CAMPOS DERIVADOS');
const fila = async (sql) => (await db.query(sql)).rows[0];

// Se prueban con datos propios y se deshacen: el contenido del seed cambia
// (las co-ubicaciones del dataset original resultaron ser un artefacto de unas
// coordenadas equivocadas), y el mecanismo debe verificarse igual.
await db.exec('begin');
await db.exec(`insert into "MetroMed_estaciones_colocadas" (estacion_id, colocada_con_id) values ('arvi','poblado')`);
const sim = await fila(`select count(*)::int n from "MetroMed_estaciones_colocadas"
                        where (estacion_id,colocada_con_id) in (('arvi','poblado'),('poblado','arvi'))`);
comparar('el trigger crea la co-ubicación inversa (1 alta → 2 filas)', sim.n, 2);

const co = await fila(`select transbordo from "MetroMed_v_estaciones" where id='poblado'`);
co.transbordo === true
  ? ok('transbordo se deriva de la co-ubicación')
  : mal(`poblado con co-ubicación debería dar transbordo=true, dio ${co.transbordo}`);

await db.exec(`delete from "MetroMed_estaciones_colocadas" where estacion_id='arvi' and colocada_con_id='poblado'`);
const tras = await fila(`select count(*)::int n from "MetroMed_estaciones_colocadas"
                         where estacion_id='poblado' and colocada_con_id='arvi'`);
comparar('borrar una co-ubicación borra también la inversa', tras.n, 0);
await db.exec('rollback');

const sa = await fila(`select array_length(lineas,1) n, transbordo from "MetroMed_v_estaciones" where id='san-antonio'`);
comparar('san-antonio sirve 3 líneas', sa.n, 3);

const arvi = await fila(`select transbordo from "MetroMed_v_estaciones" where id='arvi'`);
arvi.transbordo === false ? ok('arvi: sin transbordo') : mal('arvi debería ser false');

// El trigger de actualizado_en
await db.exec(`update "MetroMed_estaciones" set notas='prueba' where id='arvi'`);
const t = await fila(`select actualizado_en > creado_en as tocado from "MetroMed_estaciones" where id='arvi'`);
t.tocado ? ok('trigger actualizado_en') : mal('actualizado_en no se movió');

// ── Exportación ──────────────────────────────────────────────────────────────
console.log('\n  EXPORTACIÓN');
const { rows } = await db.query('select public."MetroMed_exportar_dataset"() as d');
const exportado = rows[0].d;

comparar('exportar_dataset → estaciones', exportado.estaciones.length, esperado.estaciones.length);
comparar('exportar_dataset → líneas', exportado.lineas.length, esperado.lineas.length);

const lineaA = exportado.lineas.find((l) => l.id === 'A');
const origA = esperado.lineas.find((l) => l.id === 'A');
JSON.stringify(lineaA.estaciones) === JSON.stringify(origA.estaciones)
  ? ok('orden de estaciones de la Línea A se conserva')
  : mal(`orden de Línea A cambió:\n    ${JSON.stringify(lineaA.estaciones)}`);

const lineaP = exportado.lineas.find((l) => l.id === 'P');
comparar('estado con acento al exportar', lineaP.estado, 'en construcción');

// jsonb no conserva el orden de las claves, así que se compara ordenado.
const ordenado = (o) =>
  JSON.stringify(Object.fromEntries(Object.entries(o ?? {}).sort(([a], [b]) => a.localeCompare(b))));

const acevedo = exportado.estaciones.find((e) => e.id === 'acevedo');
const acevedoOrig = esperado.estaciones.find((e) => e.id === 'acevedo');
ordenado(acevedo.servicios) === ordenado(acevedoOrig.servicios)
  ? ok('servicios de acevedo van y vuelven igual')
  : mal(`servicios de acevedo:\n    salió ${ordenado(acevedo.servicios)}\n    esperaba ${ordenado(acevedoOrig.servicios)}`);

// Comparación completa: los 70 registros, no solo una muestra.
const difieren = esperado.estaciones.filter((orig) => {
  const exp = exportado.estaciones.find((e) => e.id === orig.id);
  return !exp || ordenado(exp.servicios) !== ordenado(orig.servicios);
});
difieren.length === 0
  ? ok('las 70 estaciones exportan sus servicios sin pérdida')
  : mal(`${difieren.length} estaciones difieren: ${difieren.map((e) => e.id).join(', ')}`);

// La transferencia también se prueba con un dato propio: el del CSV original
// se retiró al comprobarse que la fuente era generada por un modelo.
await db.exec('begin');
await db.exec(`update "MetroMed_estaciones" set transferencia='peatonal', transferencia_nota='Terminal Norte' where id='caribe'`);
const tr = (await db.query(`select public."MetroMed_exportar_dataset"() as d`)).rows[0].d.estaciones
  .find((e) => e.id === 'caribe').transferencia;
tr?.tipo === 'peatonal' && tr?.nota === 'Terminal Norte'
  ? ok('la transferencia va y vuelve por la exportación')
  : mal(`transferencia exportada: ${JSON.stringify(tr)}`);
await db.exec('rollback');

comparar('tarifas exportadas', exportado.tarifas.civica.length, esperado.tarifas.civica.length);
comparar('vigencia de tarifas', exportado.tarifas.vigencia, esperado.tarifas.vigencia);

// ── RLS ──────────────────────────────────────────────────────────────────────
console.log('\n  ROW LEVEL SECURITY');
// Cada prueba va en su propia transacción: si una escritura es rechazada, la
// transacción queda abortada y cualquier orden posterior fallaría en cascada.
const comoAnon = async (sql) => {
  await db.exec('begin; set local role anon;');
  try {
    const r = await db.query(sql);
    await db.exec('rollback');
    return { ok: true, r };
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    return { ok: false, error: e.message };
  }
};

const lectura = await comoAnon('select count(*)::int n from "MetroMed_estaciones"');
lectura.ok && lectura.r.rows[0].n === esperado.estaciones.length
  ? ok('anon puede leer estaciones')
  : mal(`anon no pudo leer: ${lectura.error ?? lectura.r.rows[0].n}`);

const escritura = await comoAnon(`update "MetroMed_estaciones" set nombre='hackeado' where id='arvi'`);
escritura.ok
  ? mal('anon pudo ESCRIBIR — la política de escritura no protege')
  : ok('anon no puede escribir');

const exporta = await comoAnon('select public."MetroMed_exportar_dataset"() is not null as x');
exporta.ok && exporta.r.rows[0].x
  ? ok('anon puede llamar a "MetroMed_exportar_dataset"()')
  : mal(`anon no pudo exportar: ${exporta.error}`);

// Los GRANT deben alcanzar solo a las tablas de este esquema. Si se usara
// "grant … on all tables in schema public", una tabla ajena del mismo proyecto
// quedaría expuesta a lectura anónima.
await db.exec(`create table public.tabla_ajena (id int primary key, secreto text)`);
const fuga = await comoAnon('select count(*) from public.tabla_ajena');
fuga.ok
  ? mal('anon puede leer una tabla ajena — los grants son demasiado amplios')
  : ok('una tabla ajena del mismo esquema no queda expuesta');
await db.exec(`drop table public.tabla_ajena`);

const rlsOff = await db.query(`
  select string_agg(c.relname, ', ') as t
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`);
rlsOff.rows[0].t === null
  ? ok('todas las tablas tienen RLS activo')
  : mal(`sin RLS: ${rlsOff.rows[0].t}`);

// ── Correcciones enviadas desde la app ───────────────────────────────────────
console.log('\n  CORRECCIONES DE UBICACIÓN');

// anon debe poder proponer, que es el único punto de escritura pública.
const propuesta = await comoAnon(
  `insert into "MetroMed_correcciones" (estacion_id, lat, lng, metodo)
   values ('cordoba', 6.2845, -75.5640, 'gps')`
);
propuesta.ok
  ? ok('anon puede enviar una corrección')
  : mal(`anon no pudo proponer: ${propuesta.error}`);

// …pero no leer lo que han propuesto otros.
const fisgar = await comoAnon('select count(*) from "MetroMed_correcciones"');
fisgar.ok
  ? mal('anon puede LEER las correcciones ajenas')
  : ok('anon no puede leer las correcciones');

// El trigger rellena la distancia y la posición anterior.
await db.exec('begin');
await db.exec(`insert into "MetroMed_correcciones" (estacion_id, lat, lng, metodo)
               values ('cordoba', 6.2845, -75.5640, 'gps')`);
const c = await fila(`select distancia_m, lat_anterior, estado from "MetroMed_correcciones"
                      where estacion_id='cordoba' order by creado_en desc limit 1`);
Number.isInteger(c.distancia_m) && c.lat_anterior !== null && c.estado === 'pendiente'
  ? ok(`el trigger calcula la distancia (${c.distancia_m} m) y guarda la posición previa`)
  : mal(`trigger incompleto: ${JSON.stringify(c)}`);
await db.exec('rollback');

await debeFallar('una corrección a más de 3 km de la estación',
  `insert into "MetroMed_correcciones" (estacion_id, lat, lng)
   values ('cordoba', 6.40, -75.70)`);
await debeFallar('una corrección fuera del Valle de Aburrá',
  `insert into "MetroMed_correcciones" (estacion_id, lat, lng)
   values ('cordoba', 40.4, -3.7)`);
await debeFallar('una corrección para una estación inexistente',
  `insert into "MetroMed_correcciones" (estacion_id, lat, lng)
   values ('no-existe', 6.24, -75.57)`);


// ── Resultado ────────────────────────────────────────────────────────────────
console.log(
  fallos === 0
    ? `\n✓ Esquema verificado contra PostgreSQL ${(await fila('select current_setting($$server_version$$) v')).v}\n`
    : `\n✗ ${fallos} comprobación(es) fallida(s)\n`
);
process.exit(fallos === 0 ? 0 : 1);