/**
 * Muestra las correcciones de ubicación que ha enviado la gente desde la app.
 *
 *   npm run db:correcciones
 *
 * Solo lee y resume: aplicar una corrección es una decisión humana y se hace
 * en Supabase Studio o editando data/stations.json. Cuando varias personas
 * proponen lo mismo para una estación, la media y la dispersión dicen mucho:
 * dispersión baja con tres propuestas es una señal bastante sólida.
 *
 * Requiere una clave con permiso de lectura sobre MetroMed_correcciones, es
 * decir la service_role — la anon solo puede insertar, a propósito. Ponla en
 * .env como SUPABASE_SERVICE_KEY, o revísalas directamente en Studio con:
 *
 *   select * from "MetroMed_v_correcciones_pendientes";
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = {};
try {
  for (const linea of readFileSync(join(ROOT, '.env'), 'utf8').split(String.fromCharCode(10))) {
    const corte = linea.indexOf('=');
    if (corte === -1 || linea.trim().startsWith('#')) continue;
    env[linea.slice(0, corte).trim()] = linea.slice(corte + 1).trim();
  }
} catch { /* sin .env */ }

const URL_BASE = env.SUPABASE_URL;
const CLAVE = env.SUPABASE_SERVICE_KEY;

if (!URL_BASE || !CLAVE) {
  console.error(
    '\n  Para leer las correcciones hace falta SUPABASE_SERVICE_KEY en .env.\n' +
      '  (La clave anon solo puede INSERTAR; leer propuestas ajenas requiere\n' +
      '  más permiso, y por eso no viaja dentro de la app.)\n\n' +
      '  Alternativa sin claves: en Supabase Studio → SQL Editor\n' +
      '    select * from "MetroMed_v_correcciones_pendientes";\n'
  );
  process.exit(1);
}

const r = await fetch(
  `${URL_BASE.replace(/\/$/, '')}/rest/v1/MetroMed_v_correcciones_pendientes?select=*`,
  {
    headers: {
      apikey: CLAVE,
      Authorization: `Bearer ${CLAVE}`,
      'User-Agent': 'metro-medellin-app/1.0 (revision de correcciones)',
    },
  }
);

if (!r.ok) {
  console.error(`✗ Supabase respondió ${r.status}: ${await r.text()}`);
  process.exit(1);
}

const filas = await r.json();

if (!filas.length) {
  console.log('\n  Sin correcciones pendientes.\n');
  process.exit(0);
}

console.log(`\n  CORRECCIONES PENDIENTES (${filas.length} estaciones)\n  ${'─'.repeat(72)}`);
console.log('  Estación              Prop.  Distancia  Dispersión  Coordenada propuesta');

for (const f of filas) {
  // Mucha dispersión entre propuestas = no hay acuerdo, mirar una por una.
  const señal = f.propuestas >= 3 && Number(f.dispersion_m ?? 0) < 50 ? ' ★ fiable'
    : Number(f.dispersion_m ?? 0) > 200 ? ' ⚠ dispersas'
      : '';
  console.log(
    '  ' + `${f.estacion}${f.estacion_verificada ? '' : ' ·'}`.padEnd(22) +
      String(f.propuestas).padStart(4) + '  ' +
      `${f.distancia_media_m} m`.padStart(9) + '  ' +
      `${f.dispersion_m ?? 0} m`.padStart(10) + '  ' +
      `${f.lat_propuesta}, ${f.lng_propuesta}` + señal
  );
}

console.log(`  ${'─'.repeat(72)}`);
console.log('  · = la estación aún no tiene coordenada verificada');
console.log('\n  Para aplicar una, en Studio:');
console.log('    update "MetroMed_estaciones" set lat = …, lng = …,');
console.log("           verificado = true, fuente = 'Correcciones de usuarios',");
console.log('           actualizado = current_date');
console.log("     where id = '…';");
console.log('    update "MetroMed_correcciones" set estado = \'aplicada\', revisada_en = now()');
console.log("     where estacion_id = '…' and estado = 'pendiente';");
console.log('\n  Después:  npm run db:pull && npm run build\n');
