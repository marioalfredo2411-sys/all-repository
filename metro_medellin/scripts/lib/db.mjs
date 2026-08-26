/**
 * Capa de acceso a la base de datos del sistema (data/*.json).
 *
 * Modelo relacional:
 *   lines.json     línea → metadatos + `estaciones` (ids en orden de recorrido)
 *   stations.json  estación física → coordenadas, municipio, servicios…
 *   services.json  catálogo de servicios (taxonomía y etiquetas)
 *   fares.json     tarifas vigentes
 *
 * La relación estación↔línea vive SOLO en lines.json. `estacion.lineas` y
 * `estacion.transbordo` se calculan aquí, así que no pueden quedar desfasados
 * como pasaba con el flag `interchange` escrito a mano.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadDb(dataDir) {
  const read = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
  return {
    lineas: read('lines.json').lineas,
    estaciones: read('stations.json').estaciones,
    catalogo: read('services.json'),
    tarifas: read('fares.json'),
  };
}

/**
 * Añade a cada estación los campos derivados. No muta la entrada.
 *   lineas       nombres de línea que la sirven, en el orden de lines.json
 *   transbordo   true si sirve más de una línea, está co-ubicada con otra
 *                estación, o tiene integración de buses declarada
 */
export function derive(db) {
  const porId = new Map(db.estaciones.map((e) => [e.id, { ...e, lineas: [] }]));

  for (const linea of db.lineas) {
    for (const id of linea.estaciones) {
      porId.get(id)?.lineas.push(linea.nombre);
    }
  }

  const estaciones = [...porId.values()].map((e) => ({
    ...e,
    transbordo: e.lineas.length > 1 || e.colocadaCon.length > 0 || e.integracionBuses === true,
  }));

  return { ...db, estaciones };
}

/** Servicios confirmados (true), agrupados por categoría y ordenados. */
export function serviciosPorCategoria(estacion, catalogo) {
  const grupos = new Map();

  for (const [clave, valor] of Object.entries(estacion.servicios ?? {})) {
    if (valor !== true) continue;
    const def = catalogo.servicios[clave];
    if (!def) continue;
    if (!grupos.has(def.categoria)) grupos.set(def.categoria, []);
    grupos.get(def.categoria).push({ clave, ...def });
  }

  return [...grupos.entries()]
    .map(([clave, servicios]) => ({
      clave,
      ...catalogo.categorias[clave],
      servicios: servicios.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es')),
    }))
    .sort((a, b) => a.orden - b.orden);
}

/** Cobertura de datos: cuántas estaciones tienen servicios verificados. */
export function cobertura(db) {
  const total = db.estaciones.length;
  const conServicios = db.estaciones.filter(
    (e) => Object.keys(e.servicios ?? {}).length > 0
  ).length;
  const verificadas = db.estaciones.filter((e) => e.verificado).length;

  const porServicio = {};
  for (const clave of Object.keys(db.catalogo.servicios)) {
    const declarados = db.estaciones.filter((e) => e.servicios?.[clave] !== undefined);
    porServicio[clave] = {
      declarados: declarados.length,
      conElServicio: declarados.filter((e) => e.servicios[clave] === true).length,
    };
  }

  return { total, conServicios, verificadas, porServicio };
}
