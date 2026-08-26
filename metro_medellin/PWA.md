# PWA — despliegue

La app se despliega desde **`dist/`**, no desde la raíz del proyecto.

```bash
npm run pwa      # genera dist/
npm run serve    # lo genera y lo sirve en http://localhost:5173
```

Luego arrastrar la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop).

## Por qué una carpeta aparte

Arrastrar la raíz subiría **201 MB de `node_modules`**, los proyectos
`android/` e `ios/`, las migraciones de Supabase y —lo importante— el archivo
**`.env`**, que quedaría accesible públicamente. `dist/` lleva exactamente lo
que el navegador necesita: 68 archivos, 6 MB.

## Funciona sin conexión

Antes no. Leaflet venía de cdnjs y las tipografías de Google Fonts, y el
Service Worker dejaba pasar a la red todo lo que no fuera del propio dominio:
sin cobertura, pantalla en blanco. Una app de metro que no arranca en el metro
no sirve de mucho.

Ahora Leaflet y las fuentes están en **`vendor/`**, servidos desde el mismo
dominio y precacheados. Eso arregló de paso las **apps nativas**, que también
cargaban ambas cosas por internet: hoy tienen cero dependencias externas.

| Recurso | Estrategia | Sin red |
|---|---|---|
| HTML | red primero, caché de reserva | ✅ |
| Leaflet, fuentes, iconos | precache, caché primero | ✅ |
| Teselas del mapa | caché primero, tope de 300 | ✅ las ya visitadas |
| Overpass, Supabase, Nominatim | solo red | ❌ a propósito |

Las APIs no se cachean nunca: más vale que fallen a que sirvan datos viejos
haciéndolos pasar por actuales. Sin teselas el mapa sigue siendo útil — se ven
las líneas, las estaciones y tu posición sobre fondo liso.

## Actualizaciones

La versión del Service Worker es un **hash del contenido del build**. Cada
despliegue con cambios invalida el caché anterior solo; si no cambió nada, el
hash es el mismo y los navegadores no reinstalan.

Cuando hay versión nueva, la app muestra un aviso **«Hay una versión nueva ·
Actualizar»**. Antes el usuario se quedaba con la copia vieja hasta cerrar todas
las pestañas, sin enterarse.

`dist/_headers` marca `sw.js` e `index.html` como `no-cache` —son los que
descubren que hay algo nuevo— y `vendor/*` como inmutable durante un año.

## Instalar en el teléfono

**Android/Chrome:** menú → *Instalar aplicación*.
**iOS/Safari:** *Compartir* → *Añadir a pantalla de inicio*. Ya están puestos el
`apple-touch-icon` y las pantallas de arranque de cada tamaño de iPhone y iPad,
así que se ve como una app nativa.

## Actualizar Leaflet o las tipografías

```bash
npm run vendor     # vuelve a descargarlos a vendor/
npm run pwa
```

`vendor/` se versiona con el proyecto a propósito: un clon puede construir sin
acceso a los CDN. Se descartan los subconjuntos vietnamita, cirílico y griego
de las fuentes, que esta app nunca usa (60 KB menos).
