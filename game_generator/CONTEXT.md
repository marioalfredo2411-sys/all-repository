# CONTEXT.md — Juegos CCI AL

## Descripción del Proyecto

Aplicación web interactiva que genera listas de juegos grupales usando IA (Claude API). El usuario define el tiempo disponible, la cantidad de juegos, el tipo de grupo y la categoría de la actividad. La IA devuelve juegos adaptados al contexto seleccionado, con duración, explicación y lista de materiales para cada uno.

---

## Stack Técnico

- **Framework:** React (JSX, archivo único `.jsx`)
- **Estilos:** Inline styles con variables de color (sin CSS externo, sin Tailwind)
- **IA:** Anthropic Claude API — modelo `claude-sonnet-4-20250514`
- **Formato de salida:** JSON estructurado parseado desde la respuesta del modelo
- **Despliegue previsto:** Netlify / PWABuilder (mencionado en contexto del usuario)

---

## Identidad Visual — CCI América Latina

Basada en el **Manual de Identidad Corporativa de CCI AL** (archivo `Manual_de_Identidad_CCIAL.pdf`).

### Colores oficiales

| Color   | Nombre       | CMYK                  | HEX       | Significado                                      |
|---------|--------------|-----------------------|-----------|--------------------------------------------------|
| Verde   | Verde CCI AL | C:90 M:35 Y:55 K:35   | `#1A6B55` | Naturaleza, equilibrio, esperanza                |
| Verde oscuro | Header  | —                     | `#104438` | Fondos principales, gradientes                   |
| Naranja | Naranja CCI AL | C:0 M:75 Y:90 K:0  | `#F47920` | Energía, diversión, vitalidad, acento principal  |
| Marrón  | Marrón CCI AL | C:55 M:55 Y:55 K:55  | `#555555` | Fiabilidad, solidez                              |

### Logo

- Archivo: `LOGO_CCIAL_v3_cuadrado.png`
- Embebido como base64 directamente en el JSX como constante `LOGO_SRC`
- Componente: `<CCIALLogo size={n} />` renderiza un `<img>` con el logo oficial

### Tipografía y tono

- Fuente: `'Segoe UI', system-ui, sans-serif`
- Nombre de la app: **Juegos CCI AL**
- Subtítulo: *Recreación con Propósito · CCI América Latina*
- Footer: `🏕️ MAYORDOMÍA · RECREACIÓN CON PROPÓSITO · COMUNIDAD · FE`

---

## Valores Medulares de CCI AL (ADN de la organización)

1. **Mayordomía de la creación de Dios** — uso responsable de los recursos
2. **Recreación con Propósito** — descanso con sentido y crecimiento
3. **Caminamos y aprendemos juntos** — comunidad y diversidad de experiencias
4. **Familia Cristocéntrica** — Jesucristo como centro y guía

---

## Arquitectura de la App

### Constantes globales

```js
const C = {
  green:      "#1A6B55",
  greenDark:  "#104438",
  greenLight: "#e8f5f0",
  orange:     "#F47920",
  white:      "#FFFFFF",
  offWhite:   "#F5F8F6",
  text:       "#1a2e25",
  muted:      "#6b8c7d",
  border:     "#cce4da",
};

const LOGO_SRC = "data:image/png;base64,..."; // logo embebido
```

### Categorías de juego

```js
const CATEGORIAS = [
  { id: "campamento", label: "Campamento", emoji: "🏕️",
    desc: "actividades al aire libre, naturaleza y convivencia" },
  { id: "reunion",    label: "Reunión",    emoji: "🤝",
    desc: "dinámicas de integración para grupos en espacios cerrados" },
  { id: "capacitacion", label: "Capacitación", emoji: "📚",
    desc: "juegos de aprendizaje, reflexión y trabajo en equipo" },
];
```

### Componentes

| Componente   | Descripción                                                               |
|--------------|---------------------------------------------------------------------------|
| `CCIALLogo`  | Renderiza el logo oficial embebido. Prop: `size` (número en px)           |
| `GameCard`   | Tarjeta colapsable por juego. Muestra nombre, duración, explicación y materiales |
| `App`        | Componente raíz. Maneja estado, filtros y llamada a la API                |

### Estado principal (`App`)

| Estado      | Tipo    | Descripción                              |
|-------------|---------|------------------------------------------|
| `tiempo`    | string  | Minutos disponibles para la actividad    |
| `cantidad`  | string  | Número de juegos a generar               |
| `tipo`      | string  | Tipo de grupo: niños / jóvenes / adultos / familia |
| `categoria` | string  | ID de categoría: campamento / reunion / capacitacion |
| `games`     | array   | Lista de juegos generados por la IA      |
| `loading`   | boolean | Estado de carga durante la llamada a API |
| `error`     | string  | Mensaje de error si la API falla         |

---

## Llamada a la API de Claude

```js
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  }),
});
```

### Prompt dinámico

El prompt incluye:
- Cantidad y tiempo solicitados
- Tipo de grupo
- Contexto de la categoría (`catInfo.desc`)
- Instrucción de responder **solo JSON** con estructura definida

### Estructura JSON esperada

```json
{
  "juegos": [
    {
      "nombre": "Nombre del juego",
      "duracion": "X min",
      "explicacion": "Descripción en 2-3 oraciones.",
      "materiales": ["material1", "material2"]
    }
  ]
}
```

---

## Flujo de Usuario

```
1. Seleccionar CATEGORÍA  →  Campamento | Reunión | Capacitación
2. Ingresar TIEMPO (min)  →  número libre
3. Ingresar CANTIDAD      →  número libre (max 20)
4. Seleccionar TIPO DE GRUPO  →  niños | jóvenes | adultos | familia
5. Pulsar "🔥 Generar Juegos"
6. Ver lista de juegos colapsables con duración y materiales
```

---

## UI — Secciones de la Pantalla

### Header
- Gradiente verde oscuro a verde
- Logo CCI AL + título + subtítulo
- Barra naranja de acento inferior (5px)

### Filtro de Categorías
- 3 botones en grid (Campamento / Reunión / Capacitación)
- El seleccionado se resalta en verde con sombra
- Al cambiar categoría se limpia la lista de juegos

### Formulario
- Título dinámico con emoji y nombre de categoría activa
- 2 inputs numéricos: Tiempo y Número de juegos
- Selector de tipo de grupo (4 botones)
- Botón de generación naranja con sombra

### Resultados
- Header con conteo y tiempo total estimado
- Lista de `GameCard` con animación `slideIn`
- Footer con los 4 valores de CCI AL

---

## Historial de Iteraciones

| # | Cambio realizado |
|---|-----------------|
| 1 | Creación inicial de la app con colores propios (fondo oscuro, acento naranja) |
| 2 | Rediseño con identidad visual de CCI AL (manual de marca), nombre "Juegos CCI AL" |
| 3 | Reemplazo del logo SVG genérico por el logo PNG oficial (`LOGO_CCIAL_v3_cuadrado.png`) embebido en base64 |
| 4 | Corrección de error de sintaxis JSX causado por sustitución incorrecta de regex en el componente `CCIALLogo` |
| 5 | Adición del filtro de **3 categorías** (Campamento, Reunión, Capacitación) que adapta el prompt de la IA al contexto seleccionado |

---

## Archivos del Proyecto

| Archivo                          | Descripción                              |
|----------------------------------|------------------------------------------|
| `game-generator.jsx`             | Código fuente completo de la aplicación  |
| `LOGO_CCIAL_v3_cuadrado.png`     | Logo oficial CCI AL (embebido en el JSX) |
| `Manual_de_Identidad_CCIAL.pdf`  | Manual de marca usado como referencia    |
| `CONTEXT.md`                     | Este documento de contexto del proyecto  |

---

## Pendientes / Ideas Futuras

- Exportar / compartir la lista de juegos generada
- Historial de sesiones guardadas
- Opción de regenerar un juego individual sin perder los demás
- Filtro adicional por espacio (interior / exterior)
- Integración con Google Drive para guardar planificaciones
- Modo PWA para uso offline en campamentos
