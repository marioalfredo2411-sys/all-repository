/**
 * Informe de cobertura de la base de datos.  Uso: npm run data:report
 *
 * Sirve para saber qué falta por documentar: la mayor parte de los servicios
 * por estación no se puede deducir de los datos que ya tenía el proyecto y hay
 * que verificarlos en campo o en fuentes oficiales.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cobertura, derive, loadDb } from './lib/db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = derive(loadDb(join(ROOT, 'data')));
const cob = cobertura(db);

const barra = (n, total, ancho = 24) => {
  const llenos = total ? Math.round((n / total) * ancho) : 0;
  return '█'.repeat(llenos) + '░'.repeat(ancho - llenos);
};
const pct = (n, total) => (total ? ((n / total) * 100).toFixed(0) : '0').padStart(3) + '%';

console.log(`\n  BASE DE DATOS · Metro de Medellín\n  ${'─'.repeat(58)}`);
console.log(`  Estaciones físicas        ${db.estaciones.length}`);
console.log(`  Líneas                    ${db.lineas.length} (${db.lineas.filter((l) => l.estado === 'operativa').length} operativas)`);
console.log(`  Servicios en el catálogo  ${Object.keys(db.catalogo.servicios).length}`);
console.log(`  Tarifas vigencia          ${db.tarifas.vigencia}`);

console.log(`\n  COBERTURA\n  ${'─'.repeat(58)}`);
console.log(`  Con datos de servicios    ${barra(cob.conServicios, cob.total)} ${pct(cob.conServicios, cob.total)}  ${cob.conServicios}/${cob.total}`);
console.log(`  Verificadas con fuente    ${barra(cob.verificadas, cob.total)} ${pct(cob.verificadas, cob.total)}  ${cob.verificadas}/${cob.total}`);

const conDireccion = db.estaciones.filter((e) => e.direccion).length;
const conEstructura = db.estaciones.filter((e) => e.estructura).length;
console.log(`  Con dirección             ${barra(conDireccion, cob.total)} ${pct(conDireccion, cob.total)}  ${conDireccion}/${cob.total}`);
console.log(`  Con tipo de estructura    ${barra(conEstructura, cob.total)} ${pct(conEstructura, cob.total)}  ${conEstructura}/${cob.total}`);

console.log(`\n  SERVICIOS POR CATEGORÍA (estaciones con el dato declarado)\n  ${'─'.repeat(58)}`);
const porCategoria = new Map();
for (const [clave, def] of Object.entries(db.catalogo.servicios)) {
  if (!porCategoria.has(def.categoria)) porCategoria.set(def.categoria, []);
  porCategoria.get(def.categoria).push([clave, def]);
}
const categorias = [...porCategoria.entries()].sort(
  (a, b) => db.catalogo.categorias[a[0]].orden - db.catalogo.categorias[b[0]].orden
);

for (const [cat, servicios] of categorias) {
  console.log(`\n  ${db.catalogo.categorias[cat].etiqueta}`);
  for (const [clave, def] of servicios) {
    const s = cob.porServicio[clave];
    const marca = s.declarados === 0 ? ' ·' : ' ✓';
    console.log(
      `   ${marca} ${def.etiqueta.padEnd(26)} ${String(s.declarados).padStart(2)}/${cob.total} declarados` +
        (s.declarados ? `, ${s.conElServicio} lo tienen` : '')
    );
  }
}

console.log(`\n  TRANSBORDOS (derivados, no escritos a mano)\n  ${'─'.repeat(58)}`);
for (const e of db.estaciones.filter((x) => x.transbordo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))) {
  const motivo =
    e.lineas.length > 1
      ? e.lineas.join(' + ')
      : e.colocadaCon.length
        ? `co-ubicada con ${e.colocadaCon.join(', ')}`
        : 'integración de buses declarada';
  console.log(`   ${e.nombre.padEnd(24)} ${motivo}`);
}

if (cob.conServicios < cob.total) {
  console.log(
    `\n  Faltan ${cob.total - cob.conServicios} estaciones por documentar.` +
      `\n  Ver data/README.md para la convención de edición.\n`
  );
}
