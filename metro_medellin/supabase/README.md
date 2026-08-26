# Supabase

Backend de **edición** de la base de datos del sistema.

## Por qué no es el origen en tiempo de ejecución

La app es offline-first: dibuja el mapa al instante con datos locales y solo
después consulta Overpass. Si las estaciones vinieran de la red, la app no
arrancaría en el metro — que es justo donde se usa. Además las apps nativas
empaquetan `index.html`, sin red garantizada.

Así que Supabase es el **panel de administración**: varias personas documentando
estaciones desde Studio, con validación del lado del servidor. Los datos bajan a
`data/*.json` y de ahí a la app.

```
Supabase  ──db:pull──▶  data/*.json  ──data:build──▶  index.html  ──sync──▶  apps
    ▲                        │
    └────────db:push─────────┘
```

---

## Puesta en marcha

### Opción A — un solo archivo, sin instalar nada

1. Supabase → **SQL Editor** → New query
2. Pegar el contenido de **[`instalar.sql`](instalar.sql)** (52 KB) y ejecutar

Crea el esquema entero y lo carga con los datos. Al final devuelve un recuento
para comprobar de un vistazo que quedó bien:

```
 estaciones | lineas | servicios_confirmados | verificadas
         70 |     12 |                    23 |          55
```

Se puede volver a ejecutar cuantas veces haga falta: crea lo que falte y
actualiza los datos, sin duplicar. Funciona también sobre un PostgreSQL normal
—los roles `anon` y `authenticated` se crean si no existen—.

Lo único que **no** hace es alterar tablas que ya existan con otra forma. Si
vienes de una versión anterior del esquema, la cabecera del archivo trae el
bloque `drop` para empezar de cero.

### Opción B — con la CLI, para trabajo continuado

```bash
npm i -g supabase
supabase link --project-ref <tu-ref>
npm run db:push            # migraciones + seed
```

Luego copiar `.env.example` a `.env` con la URL y la clave anon del proyecto
(Supabase → Project Settings → API), que es lo que necesita `db:pull`.

| Comando | Qué hace |
|---|---|
| `npm run db:sql` | Regenera `instalar.sql` y `seed.sql` desde `data/*.json` |
| `npm run db:test` | Ejecuta todo contra un PostgreSQL real y lo verifica |
| `npm run db:push` | Aplica migraciones y seed al proyecto enlazado |
| `npm run db:pull` | Trae los datos de Supabase a `data/*.json` |

### Los tres archivos

| Archivo | Para qué | Se edita |
|---|---|---|
| `migrations/*.sql` | Evolución del esquema | **Sí**, a mano |
| `instalar.sql` | Instalar de cero en un paso | No, generado |
| `seed.sql` | Solo datos, para la CLI | No, generado |

`instalar.sql` se arma **concatenando las migraciones tal cual**, así que no hay
dos versiones del esquema que puedan divergir: para cambiar algo se toca la
migración y se corre `npm run db:sql`.

`npm run db:test` no necesita Docker ni conexión: usa **PGlite**, PostgreSQL
compilado a WebAssembly. Prueba los dos caminos de instalación —el archivo
autónomo sobre una base vacía y el flujo de la CLI—, comprueba que repetirlos no
duplica nada, y verifica restricciones, triggers, RLS y la exportación.

---

## Nomenclatura

La base se comparte con otros proyectos, así que **todo lleva el prefijo
`MetroMed_`**: tablas, vistas, tipos, funciones e índices. Al abrir el esquema
quedan agrupados y se ve de un vistazo de quién son.

### Hay que entrecomillar siempre

PostgreSQL pasa a minúsculas cualquier identificador sin comillas. Para
conservar las mayúsculas de `MetroMed_`, el nombre va entre comillas dobles —
y eso obliga a escribirlas **en todas** las consultas:

```sql
select * from "MetroMed_estaciones";     -- ✅
select * from MetroMed_estaciones;       -- ❌ error: «metromed_estaciones» no existe
```

El error es confuso la primera vez (dice que no existe una tabla en minúsculas
que tú nunca escribiste). En el Table Editor de Studio, en la API REST y en
`supabase-js` (`.from('MetroMed_estaciones')`) no hay que hacer nada especial:
solo afecta al SQL escrito a mano.

> Si prefieres ahorrarte las comillas, avísame y lo paso todo a
> `metromed_estaciones` en minúsculas: se sigue agrupando igual en el esquema y
> desaparece el problema.

## Esquema

```
MetroMed_categorias_servicio ──┐
                               ├── MetroMed_servicios ──┐
MetroMed_lineas ───┐                                    ├── MetroMed_estacion_servicio
                   ├── MetroMed_linea_estacion ──┐      │
MetroMed_estaciones ──────────────────────────────┴─────┴── MetroMed_estaciones_colocadas
MetroMed_tarifas_civica    MetroMed_tarifas_especiales
```

| Tabla | Nota |
|---|---|
| `MetroMed_estaciones` | **Una fila por estación física.** San Antonio aparece una vez, no tres |
| `MetroMed_linea_estacion` | `orden` = posición en el recorrido; de ahí sale el trazado del mapa |
| `MetroMed_estacion_servicio` | **La ausencia de fila significa "sin verificar"** |
| `MetroMed_estaciones_colocadas` | Simétrica por trigger: insertar A→B crea B→A |

Vistas: `MetroMed_v_estaciones`, `MetroMed_v_lineas`, `MetroMed_v_cobertura`,
`MetroMed_v_cobertura_servicio`. Función de exportación:
`MetroMed_exportar_dataset()`.

Las **claves del JSON que devuelve la exportación no llevan prefijo**
(`estaciones`, `lineas`, `servicios`…): son el contrato con `data/*.json` y con
la app, que no sabe nada de Supabase.

### La regla que sostiene todo lo demás

`estacion_servicio.disponible` es `NOT NULL` y **solo existen filas de lo que se
sabe**. Un `false` significa "se comprobó que no lo tiene", no "no tenemos ni
idea". Esa distinción es la que evita que la app le diga a alguien en silla de
ruedas que una estación tiene ascensor sin que nadie lo haya comprobado.

### Campos derivados, nunca escritos

`v_estaciones` calcula `lineas`, `colocada_con` y `transbordo`. Antes eran un
flag a mano en cada uno de los 83 registros estación×línea, y se desincronizaba
al tocar cualquier línea.

---

## Restricciones que aplica la base

Verificadas en `npm run db:test`:

- Coordenadas dentro del Valle de Aburrá (`lat 6.05–6.45`, `lng −75.75 a −75.40`)
- `id` en minúsculas, sin tildes, con guiones
- `verificado = true` exige `fuente`
- Color de línea en formato `#rrggbb`
- Una línea operativa no puede estar sin horario, y el horario debe traer las
  dos franjas en `HH:MM`
- Un servicio debe existir en el catálogo
- Dos estaciones no pueden ocupar la misma posición en una línea
- Una nota de transferencia sin tipo de transferencia
- Una estación co-ubicada consigo misma
- Tarifas negativas

---

## Seguridad

Lectura pública (es información de transporte público), escritura solo con
sesión autenticada. La clave anon viaja dentro del bundle de la app y cualquiera
puede extraerla, así que no da permiso de escritura a nada.

Ojo: **RLS filtra filas, no concede acceso a la tabla**. Hacen falta las dos
capas — `GRANT` y política — y por eso la migración de RLS declara ambas en vez
de confiar en los privilegios por defecto del proyecto.

---

## Cambiar el esquema

1. Nueva migración en `migrations/` con prefijo de fecha (`supabase migration new <nombre>`)
2. `npm run db:test` para comprobarla contra PostgreSQL antes de subirla
3. `npm run db:sql` para regenerar `instalar.sql` con el cambio incluido
4. `npm run db:push`

Las migraciones deben ser **re-ejecutables** (`if not exists`, `drop … if
exists`, `create or replace`), porque `instalar.sql` las concatena y ese archivo
promete poder correrse dos veces. `db:test` lo comprueba.

Si el cambio afecta a la forma exportada, actualizar también
`exportar_dataset()` en `20260812000200_vistas.sql` y el validador
`scripts/validate-data.mjs`, que es el que protege el mismo contrato del lado
de los archivos.

---

## Correcciones enviadas desde la app

El botón «¿Ubicación incorrecta?» de la app escribía **solo en el localStorage
del propio teléfono**: la corrección mejoraba la app de esa persona y no se
enteraba nadie más. Ahora también manda la propuesta a
`MetroMed_correcciones`, que funciona como bandeja de entrada.

Es la **única tabla donde `anon` puede escribir, y solo INSERT**. No puede leer,
modificar ni borrar propuestas ajenas, y las coordenadas oficiales no cambian
hasta que una persona revisa y aplica.

Contra el abuso, un trigger rechaza cualquier propuesta a más de 3 km de la
posición registrada: cubre de sobra un error real de GPS e impide mover una
estación a otro municipio.

### Revisar lo que llega

En Studio → SQL Editor:

```sql
select * from "MetroMed_v_correcciones_pendientes";
```

La vista agrupa por estación y calcula media y dispersión. **Varias propuestas
que coinciden son la señal fuerte**: tres personas con menos de 50 m de
dispersión valen más que una sola muy segura.

O desde la terminal, si pones `SUPABASE_SERVICE_KEY` en `.env`:

```bash
npm run db:correcciones
```

### Aplicar una

```sql
update "MetroMed_estaciones"
   set lat = 6.28450, lng = -75.56400,
       verificado = true,
       fuente = 'Correcciones de usuarios',
       actualizado = current_date
 where id = 'cordoba';

update "MetroMed_correcciones"
   set estado = 'aplicada', revisada_en = now()
 where estacion_id = 'cordoba' and estado = 'pendiente';
```

Y luego, para que llegue a la app:

```bash
npm run db:pull && npm run build
```

### Qué ve el usuario

Las estaciones sin coordenada verificada muestran en su ficha un aviso de
**«Ubicación aproximada»** que invita a corregirla. Son las 15 que OpenStreetMap
todavía no tiene: las ocho intermedias de la Línea O y parte de Metroplús.
