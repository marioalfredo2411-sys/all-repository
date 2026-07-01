# 🌍 FIFA World Cup 2026 — Proyecto React

## Stack
- **React 18** con Hooks
- **Vite 5** como bundler
- **CSS-in-JS** inline (objeto `S` al final del archivo)
- Un solo archivo de componente: `src/App.jsx`

## Estructura
```
mundial2026/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx        ← entrada React
│   ├── index.css       ← reset global + scrollbar
│   └── App.jsx         ← TODO el código de la app
└── public/
    └── favicon.svg
```

## Colores oficiales del Mundial 2026
| Token       | Hex       | Uso                     |
|-------------|-----------|-------------------------|
| Rojo        | `#E61D25` | Acentos, botón Auto     |
| Azul        | `#2A398D` | Primario, headers       |
| Verde       | `#3CAC3B` | Clasificados, guardar   |
| Dorado      | `#FFD700` | Puntos, scores, énfasis |
| Fondo       | `#0a0e1a` | Background general      |

## Componentes principales en App.jsx
- `MundialApp` — componente raíz, maneja todo el estado
- `DateHeader` — cabecera de fecha en el calendario
- `CalendarMatchCard` — tarjeta de partido en la vista Calendario
- `KOBracket` — bracket de eliminatorias con `KOMatch` anidado

## Estado global (en MundialApp)
```js
lang            // "es" | "en"
activeTab       // "calendar" | "groups" | "knockout"
groupMatches    // { A: [...matches], B: [...], ... }
knockout        // { r32, r16, semi, final, champion }
scheduleScores  // { [matchId]: { h, a, played, editing } }
selectedGroup   // "A" .. "L"
calFilter       // "all" | "upcoming" | "played"
calGroup        // "all" | "A".."L" | "KO"
calMd           // "all" | "1" | "2" | "3" | "KO"
```

## Datos clave
- `SCHEDULE` — array con los 102 partidos (fecha, hora ET, venue, grupo, jornada)
- `GROUPS_DATA` — equipos y banderas de los 12 grupos
- `SCHEDULE_BY_TEAMS` — lookup rápido por `"home|away"`
- `GROUP_COLORS` — color hex por grupo (A–L + KO)
- `T` — objeto de traducciones `{ es: {...}, en: {...} }`

## Comandos
```bash
npm install     # instalar dependencias
npm run dev     # servidor local en http://localhost:3000
npm run build   # build de producción en /dist
```

## Cómo pedir cambios a Claude en VS Code
Abre el chat de Claude (Ctrl+Shift+P → "Claude: Open Chat") y describe lo que quieres,
por ejemplo:
- *"Agrega un contador de días hasta el inicio del mundial"*
- *"Cambia el color del badge del grupo A a naranja"*
- *"Añade animación al guardar un resultado"*
- *"Muestra el logo de cada país en los partidos"*

Claude puede ver todo el archivo App.jsx y hacer ediciones directas.
