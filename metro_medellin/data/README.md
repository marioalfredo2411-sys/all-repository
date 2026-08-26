# Base de datos del sistema

Fuente de verdad de líneas, estaciones, servicios y tarifas. `index.html` **no**
se edita a mano en su bloque de datos: se genera desde aquí.

```
data/
├── lines.json      líneas + estaciones en orden de recorrido
├── stations.json   estaciones físicas (una por estación, no una por línea)
├── services.json   catálogo de servicios (la taxonomía)
└── fares.json      tarifas vigentes
```

```bash
npm run data:check     # valida sin tocar nada
npm run data:build     # valida e inyecta en index.html
npm run data:report    # qué falta por documentar
```

`npm run build` ejecuta `data:build` automáticamente, así que las apps nativas
nunca se quedan con datos viejos.

---

## Modelo

**La relación estación↔línea vive solo en `lines.json`**, en el array
`estaciones` (ids en orden de recorrido, que es el que usa el mapa para trazar
la ruta). En `stations.json` cada estación aparece **una sola vez**, aunque la
sirvan tres líneas.

Se calculan solos, no se escriben:

| Campo | Cómo sale |
|---|---|
| `estacion.lineas` | qué líneas la listan en `lines.json` |
| `estacion.transbordo` | `lineas.length > 1` · o `colocadaCon` no vacío · o `integracionBuses: true` |

> Antes existía un flag `interchange` escrito a mano en cada uno de los 83
> registros estación×línea. Se podía desincronizar al añadir una línea y no
> había forma de saber por qué una estación estaba marcada. Ahora se deriva.

---

## La convención de tres estados

Este es el punto importante del diseño. Cada servicio admite **tres** valores:

| Valor | Significa | En la app | En Supabase |
|---|---|---|---|
| `true` | Confirmado: la estación **sí** lo tiene | Chip normal | fila con `disponible = true` |
| `false` | Confirmado: la estación **no** lo tiene | Chip tachado y atenuado | fila con `disponible = false` |
| ausente o `null` | **No se ha verificado** | No se muestra | sin fila |

**`false` y "no sabemos" no son lo mismo.** Un usuario en silla de ruedas que
lee "sin ascensor" toma una decisión distinta que uno que lee "no hay datos".
Por eso los servicios no verificados se omiten en vez de mostrarse como
ausentes: la app nunca afirma algo que no está confirmado.

Como lo ausente ya significa "sin verificar", **solo hay que escribir lo que se
sabe**. Una estación recién documentada puede tener tres claves y ninguna más.

---

## Añadir servicios a una estación

Buscar la estación por `id` en `stations.json` y rellenar:

```json
{
  "id": "san-antonio",
  "nombre": "San Antonio",
  "servicios": {
    "ascensor": true,
    "banos": true,
    "taquilla": true,
    "cajeroAutomatico": false
  },
  "verificado": true,
  "fuente": "Visita en sitio, 2026-08-12",
  "actualizado": "2026-08-12"
}
```

Reglas que aplica el validador:

- Las claves de `servicios` deben existir en `services.json`. Una clave mal
  escrita es un error, no un servicio nuevo.
- Los valores solo pueden ser `true`, `false` o `null`.
- Si declaras servicios, pon `fuente`. Si marcas `verificado: true`, es
  obligatorio.
- `actualizado` va en formato `AAAA-MM-DD`.

Para añadir un tipo de servicio que no existe, primero se agrega a
`services.json` (con etiqueta, icono, categoría y descripción) y luego ya se
puede usar en las estaciones.

---

## Estado actual de los datos

Lo que está poblado y de dónde viene:

| Dato | Estado | Origen |
|---|---|---|
| Líneas, colores, tramos | Completo | Mapa oficial SITVA (foto en estación Estadio) |
| Estaciones y orden por línea | Completo | Dataset original del proyecto |
| Coordenadas | Completo | Hardcodeadas + refresco desde OSM al arrancar |
| Municipio | Completo | Ubicación de la estación |
| Horarios por línea | Completo | metrodemedellin.gov.co |
| Tarifas 2026 | Completo | metrodemedellin.gov.co |
| Coordenadas | 55/70 verificadas | **OpenStreetMap**, agosto 2026 |
| Transbordos | Derivado | Calculado, no escrito |
| Cicloparqueadero y EnCicla | 19/70 estaciones | OpenStreetMap (solo positivos) |
| Resto de servicios (30 de 32) | Vacío | — |
| Dirección, estructura | Vacío | — |

Faltan 15 coordenadas (Línea O y Metroplús, aún sin mapear en OSM) y casi todos
los servicios. No se pueden deducir de los datos que ya tenía el proyecto, y
rellenarlos a ojo produciría una app que afirma que una estación tiene ascensor
cuando quizá no lo tiene.

```bash
npm run data:sync            # pasada en seco: qué cambiaría según OSM
npm run data:sync -- --aplicar
```

`sync-osm.mjs` **solo escribe `true`**, nunca `false`: OSM es incompleto y que
un cicloparqueadero no esté mapeado no prueba que no exista. Eso es exactamente
la diferencia entre `false` y "sin verificar".

### El episodio del CSV generado por IA

En agosto de 2026 se importó un CSV con coordenadas y cuatro columnas de
servicio para 30 estaciones. Resultó estar **generado por un modelo de lenguaje**
y sus datos eran inventados. Quedó documentado porque el modo de fallo se repite:

| Comprobación | Resultado |
|---|---|
| Coordenadas vs OSM | CSV a 309 m de mediana · **nuestros datos a 1.587 m** |
| EnCicla vs OSM | coincide en 15 de 30 — nivel de azar |
| Cicloparqueadero vs OSM | coincide en 12 de 30 — peor que el azar |

Las **120 afirmaciones de servicio se borraron**: a nivel de azar no aportan
información, y un dato inventado es peor que ningún dato.

Lo incómodo es que el CSV destapó un problema mayor. Al contrastar con OSM
resultó que **las coordenadas del proyecto estaban mucho peor que las del CSV**:
1,5 km de desviación mediana. La primera comprobación que se hizo —comparar la
longitud del trazado con la cifra publicada— dio 25,8 km exactos para la Línea A
y pareció exonerarlas, pero un sesgo sistemático puede conservar la longitud
total. Con las coordenadas de OSM la Línea A da 24,1 km, un 6 % por debajo de la
vía real, que es justo lo que se espera al unir estaciones en línea recta.

De paso salió que la **Línea H estaba mal compuesta**: incluía El Pinal (que es
de la Línea M) y una estación «Las Esperanzas» que no existe — la real es **Las
Torres**. Con 4 estaciones el trazado medía 5,0 km frente a los 1,4 publicados;
corregida a Oriente – Las Torres – Villa Sierra da 1,42 km.

**Lecciones:** una sola comprobación agregada puede exonerar datos malos; hace
falta una fuente independiente por registro. Y `fuente` no es burocracia: fue lo
que permitió localizar y revertir exactamente las 120 afirmaciones contaminadas.

### Importar otro CSV

```bash
npm run data:import -- archivo.csv --fuente "de dónde salió"     # pasada en seco
npm run data:import -- archivo.csv --fuente "..." --aplicar      # escribe
```

Contrastar **siempre** contra OSM (`npm run data:sync`) antes de dar por buena
una fuente nueva.

### Dos excepciones, marcadas

`aguacatala` e `integracion-floresta` tienen `integracionBuses: true` heredado
del flag `interchange` original de `index.html`. No hay fuente documentada, así
que están con `verificado: false` y una nota en `fuente`. Se conservan para no
cambiar el comportamiento de la app, pero conviene confirmarlas o quitarlas.

---

## Cambiar las tarifas

Suben cada año. En `fares.json`: actualizar los valores, subir `vigencia` y
poner `actualizado`. Los textos que ve el usuario se arman solos desde ahí — no
hay precios escritos en `index.html`.

---

## Añadir una estación o una línea nueva

1. Añadir la estación a `stations.json` con un `id` en minúsculas, sin tildes y
   con guiones (`doce-de-octubre`).
2. Insertarla en el array `estaciones` de su línea en `lines.json`, **en la
   posición correcta del recorrido** (de ahí sale el trazado del mapa).
3. `npm run data:build`.

Para una línea nueva: añadir el objeto a `lines.json` con `color`, `tipo`
(`metro` · `cable` · `tranvia` · `bus`), `estado`, `horario` y sus estaciones.
La leyenda, los filtros y el trazado la recogen solos.
