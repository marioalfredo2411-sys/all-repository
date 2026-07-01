import { useState, useEffect, useRef } from "react";

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  es: {
    title: "FIFA WORLD CUP 26",
    subtitle: "",
    groups: "GRUPOS",
    knockout: "ELIMINATORIAS",
    calendar: "CALENDARIO",
    stats: "ESTADÍSTICAS",
    manual: "Manual",
    pts: "Pts", pj: "PJ", pg: "PG", pe: "PE", pp: "PP",
    gf: "GF", gc: "GC", dg: "DG", team: "Equipo", group: "Grupo",
    round32: "Octavos de Final", round16: "Cuartos de Final",
    semis: "Semifinales", final: "Final", winner: "CAMPEÓN",
    saveScore: "Guardar", editScore: "Editar", score: "Resultado",
    vs: "vs", advancesTop2: "Top 2 de cada grupo + 8 mejores terceros clasifican",
    bestThirds: "Mejores Terceros", grp: "Grp", advances: "Clasifica", notAdvances: "Eliminado",
    tieNote: "Desempate FIFA 2026: H2H Pts → H2H DG → H2H GF → DG global → GF global",
    resetData: "Reiniciar",
    confirmReset: "¿Reiniciar todos los datos?", topScorers: "Goleadores",
    addGoal: "Agregar", playerName: "Jugador", noScorers: "Sin goleadores aún",
    totalGoals: "Goles Totales", totalMatches: "Partidos Jugados",
    avgGoals: "Promedio x Partido", teamsAdvanced: "Equipos Clasif.",
    today: "HOY", upcoming: "Próximos", played: "Jugados",
    allMatches: "Todos", filterGroup: "Filtrar por grupo",
    matchday1: "Jornada 1", matchday2: "Jornada 2", matchday3: "Jornada 3",
    knockoutRound: "Eliminatoria", allGroups: "Todos los grupos",
    venue: "Estadio", time: "Hora ET",
  },
  en: {
    title: "FIFA WORLD CUP 26",
    subtitle: "",
    groups: "GROUPS",
    knockout: "KNOCKOUT",
    calendar: "SCHEDULE",
    stats: "STATS",
    manual: "Manual",
    pts: "Pts", pj: "MP", pg: "W", pe: "D", pp: "L",
    gf: "GF", gc: "GA", dg: "GD", team: "Team", group: "Group",
    round32: "Round of 16", round16: "Quarter-Finals",
    semis: "Semi-Finals", final: "Final", winner: "CHAMPION",
    saveScore: "Save", editScore: "Edit", score: "Score",
    vs: "vs", advancesTop2: "Top 2 from each group + 8 best 3rd-place teams advance",
    bestThirds: "Best 3rd Place", grp: "Grp", advances: "Advances", notAdvances: "Eliminated",
    tieNote: "FIFA 2026 tiebreaker: H2H Pts → H2H GD → H2H GF → Overall GD → Overall GF",
    resetData: "Reset",
    confirmReset: "Reset all data?", topScorers: "Top Scorers",
    addGoal: "Add", playerName: "Player", noScorers: "No scorers yet",
    totalGoals: "Total Goals", totalMatches: "Matches Played",
    avgGoals: "Goals per Match", teamsAdvanced: "Teams Advanced",
    today: "TODAY", upcoming: "Upcoming", played: "Played",
    allMatches: "All", filterGroup: "Filter by group",
    matchday1: "Matchday 1", matchday2: "Matchday 2", matchday3: "Matchday 3",
    knockoutRound: "Knockout", allGroups: "All groups",
    venue: "Venue", time: "Time ET",
  },
};

// ── FULL SCHEDULE DATA ────────────────────────────────────────────────────────
const SCHEDULE = [
  // JORNADA 1
  { id:1,  date:"2026-06-11", time:"3:00 PM", group:"A", home:"México",         homeF:"🇲🇽", away:"Sudáfrica",       awayF:"🇿🇦", venue:"Mexico City",    md:1 },
  { id:2,  date:"2026-06-11", time:"10:00 PM",group:"A", home:"Corea del Sur",  homeF:"🇰🇷", away:"Chequia",         awayF:"🇨🇿", venue:"Guadalajara",    md:1 },
  { id:3,  date:"2026-06-12", time:"3:00 PM", group:"B", home:"Canadá",         homeF:"🇨🇦", away:"Bosnia-Herz.",    awayF:"🇧🇦", venue:"Toronto",        md:1 },
  { id:4,  date:"2026-06-12", time:"9:00 PM", group:"D", home:"Estados Unidos", homeF:"🇺🇸", away:"Paraguay",        awayF:"🇵🇾", venue:"Los Angeles",    md:1 },
  { id:5,  date:"2026-06-13", time:"3:00 PM", group:"B", home:"Qatar",          homeF:"🇶🇦", away:"Suiza",           awayF:"🇨🇭", venue:"San Francisco",  md:1 },
  { id:6,  date:"2026-06-13", time:"6:00 PM", group:"C", home:"Brasil",         homeF:"🇧🇷", away:"Marruecos",       awayF:"🇲🇦", venue:"New York/NJ",    md:1 },
  { id:7,  date:"2026-06-13", time:"9:00 PM", group:"C", home:"Haití",          homeF:"🇭🇹", away:"Escocia",         awayF:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", venue:"Boston",         md:1 },
  { id:8,  date:"2026-06-14", time:"12:00 AM",group:"D", home:"Australia",      homeF:"🇦🇺", away:"Turquía",         awayF:"🇹🇷", venue:"Vancouver",      md:1 },
  { id:9,  date:"2026-06-14", time:"1:00 PM", group:"E", home:"Alemania",       homeF:"🇩🇪", away:"Curazao",         awayF:"🇨🇼", venue:"Houston",        md:1 },
  { id:10, date:"2026-06-14", time:"4:00 PM", group:"F", home:"Países Bajos",   homeF:"🇳🇱", away:"Japón",           awayF:"🇯🇵", venue:"Dallas",         md:1 },
  { id:11, date:"2026-06-14", time:"7:00 PM", group:"E", home:"Costa de Marfil",homeF:"🇨🇮", away:"Ecuador",         awayF:"🇪🇨", venue:"Philadelphia",   md:1 },
  { id:12, date:"2026-06-14", time:"10:00 PM",group:"F", home:"Túnez",          homeF:"🇹🇳", away:"Suecia",          awayF:"🇸🇪", venue:"Monterrey",      md:1 },
  { id:13, date:"2026-06-15", time:"12:00 PM",group:"H", home:"España",         homeF:"🇪🇸", away:"Cabo Verde",      awayF:"🇨🇻", venue:"Atlanta",        md:1 },
  { id:14, date:"2026-06-15", time:"3:00 PM", group:"G", home:"Bélgica",        homeF:"🇧🇪", away:"Egipto",          awayF:"🇪🇬", venue:"Seattle",        md:1 },
  { id:15, date:"2026-06-15", time:"6:00 PM", group:"H", home:"Arabia Saudita", homeF:"🇸🇦", away:"Uruguay",         awayF:"🇺🇾", venue:"Miami",          md:1 },
  { id:16, date:"2026-06-15", time:"9:00 PM", group:"G", home:"Irán",           homeF:"🇮🇷", away:"Nueva Zelanda",   awayF:"🇳🇿", venue:"Los Angeles",    md:1 },
  { id:17, date:"2026-06-16", time:"3:00 PM", group:"I", home:"Francia",        homeF:"🇫🇷", away:"Senegal",         awayF:"🇸🇳", venue:"New York/NJ",    md:1 },
  { id:18, date:"2026-06-16", time:"6:00 PM", group:"I", home:"Irak",           homeF:"🇮🇶", away:"Noruega",         awayF:"🇳🇴", venue:"Boston",         md:1 },
  { id:19, date:"2026-06-16", time:"9:00 PM", group:"J", home:"Argentina",      homeF:"🇦🇷", away:"Argelia",         awayF:"🇩🇿", venue:"Kansas City",    md:1 },
  { id:20, date:"2026-06-17", time:"12:00 AM",group:"J", home:"Austria",        homeF:"🇦🇹", away:"Jordania",        awayF:"🇯🇴", venue:"San Francisco",  md:1 },
  { id:21, date:"2026-06-17", time:"1:00 PM", group:"K", home:"Portugal",       homeF:"🇵🇹", away:"R.D. Congo",      awayF:"🇨🇩", venue:"Houston",        md:1 },
  { id:22, date:"2026-06-17", time:"4:00 PM", group:"L", home:"Inglaterra",     homeF:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", away:"Croacia",         awayF:"🇭🇷", venue:"Dallas",         md:1 },
  { id:23, date:"2026-06-17", time:"7:00 PM", group:"L", home:"Ghana",          homeF:"🇬🇭", away:"Panamá",          awayF:"🇵🇦", venue:"Toronto",        md:1 },
  { id:24, date:"2026-06-17", time:"10:00 PM",group:"K", home:"Uzbekistán",     homeF:"🇺🇿", away:"Colombia",        awayF:"🇨🇴", venue:"Mexico City",    md:1 },
  // JORNADA 2
  { id:25, date:"2026-06-18", time:"12:00 PM",group:"A", home:"Chequia",        homeF:"🇨🇿", away:"Sudáfrica",       awayF:"🇿🇦", venue:"Atlanta",        md:2 },
  { id:26, date:"2026-06-18", time:"3:00 PM", group:"B", home:"Suiza",          homeF:"🇨🇭", away:"Bosnia-Herz.",    awayF:"🇧🇦", venue:"Los Angeles",    md:2 },
  { id:27, date:"2026-06-18", time:"6:00 PM", group:"B", home:"Canadá",         homeF:"🇨🇦", away:"Qatar",           awayF:"🇶🇦", venue:"Vancouver",      md:2 },
  { id:28, date:"2026-06-18", time:"9:00 PM", group:"A", home:"México",         homeF:"🇲🇽", away:"Corea del Sur",   awayF:"🇰🇷", venue:"Guadalajara",    md:2 },
  { id:29, date:"2026-06-19", time:"3:00 PM", group:"D", home:"Estados Unidos", homeF:"🇺🇸", away:"Australia",       awayF:"🇦🇺", venue:"Seattle",        md:2 },
  { id:30, date:"2026-06-19", time:"6:00 PM", group:"C", home:"Escocia",        homeF:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", away:"Marruecos",       awayF:"🇲🇦", venue:"Boston",         md:2 },
  { id:31, date:"2026-06-19", time:"8:30 PM", group:"C", home:"Brasil",         homeF:"🇧🇷", away:"Haití",           awayF:"🇭🇹", venue:"Philadelphia",   md:2 },
  { id:32, date:"2026-06-19", time:"11:00 PM",group:"D", home:"Turquía",        homeF:"🇹🇷", away:"Paraguay",        awayF:"🇵🇾", venue:"San Francisco",  md:2 },
  { id:33, date:"2026-06-20", time:"1:00 PM", group:"F", home:"Países Bajos",   homeF:"🇳🇱", away:"Suecia",          awayF:"🇸🇪", venue:"Houston",        md:2 },
  { id:34, date:"2026-06-20", time:"4:00 PM", group:"E", home:"Alemania",       homeF:"🇩🇪", away:"Costa de Marfil", awayF:"🇨🇮", venue:"Toronto",        md:2 },
  { id:35, date:"2026-06-20", time:"8:00 PM", group:"E", home:"Ecuador",        homeF:"🇪🇨", away:"Curazao",         awayF:"🇨🇼", venue:"Kansas City",    md:2 },
  { id:36, date:"2026-06-21", time:"12:00 AM",group:"F", home:"Túnez",          homeF:"🇹🇳", away:"Japón",           awayF:"🇯🇵", venue:"Monterrey",      md:2 },
  { id:37, date:"2026-06-21", time:"12:00 PM",group:"H", home:"España",         homeF:"🇪🇸", away:"Arabia Saudita",  awayF:"🇸🇦", venue:"Atlanta",        md:2 },
  { id:38, date:"2026-06-21", time:"3:00 PM", group:"G", home:"Bélgica",        homeF:"🇧🇪", away:"Irán",            awayF:"🇮🇷", venue:"Los Angeles",    md:2 },
  { id:39, date:"2026-06-21", time:"6:00 PM", group:"H", home:"Uruguay",        homeF:"🇺🇾", away:"Cabo Verde",      awayF:"🇨🇻", venue:"Miami",          md:2 },
  { id:40, date:"2026-06-21", time:"9:00 PM", group:"G", home:"Nueva Zelanda",  homeF:"🇳🇿", away:"Egipto",          awayF:"🇪🇬", venue:"Vancouver",      md:2 },
  { id:41, date:"2026-06-22", time:"1:00 PM", group:"J", home:"Argentina",      homeF:"🇦🇷", away:"Austria",         awayF:"🇦🇹", venue:"Dallas",         md:2 },
  { id:42, date:"2026-06-22", time:"5:00 PM", group:"I", home:"Francia",        homeF:"🇫🇷", away:"Irak",            awayF:"🇮🇶", venue:"Philadelphia",   md:2 },
  { id:43, date:"2026-06-22", time:"8:00 PM", group:"I", home:"Noruega",        homeF:"🇳🇴", away:"Senegal",         awayF:"🇸🇳", venue:"New York/NJ",    md:2 },
  { id:44, date:"2026-06-22", time:"11:00 PM",group:"J", home:"Jordania",       homeF:"🇯🇴", away:"Argelia",         awayF:"🇩🇿", venue:"San Francisco",  md:2 },
  { id:45, date:"2026-06-23", time:"1:00 PM", group:"K", home:"Portugal",       homeF:"🇵🇹", away:"Uzbekistán",      awayF:"🇺🇿", venue:"Houston",        md:2 },
  { id:46, date:"2026-06-23", time:"4:00 PM", group:"L", home:"Inglaterra",     homeF:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", away:"Ghana",           awayF:"🇬🇭", venue:"Boston",         md:2 },
  { id:47, date:"2026-06-23", time:"7:00 PM", group:"L", home:"Croacia",        homeF:"🇭🇷", away:"Panamá",          awayF:"🇵🇦", venue:"Toronto",        md:2 },
  { id:48, date:"2026-06-23", time:"10:00 PM",group:"K", home:"R.D. Congo",     homeF:"🇨🇩", away:"Colombia",        awayF:"🇨🇴", venue:"Guadalajara",    md:2 },
  // JORNADA 3
  { id:49, date:"2026-06-24", time:"9:00 PM", group:"A", home:"Sudáfrica",      homeF:"🇿🇦", away:"Corea del Sur",   awayF:"🇰🇷", venue:"Mexico City",    md:3 },
  { id:50, date:"2026-06-24", time:"9:00 PM", group:"A", home:"Chequia",        homeF:"🇨🇿", away:"México",          awayF:"🇲🇽", venue:"Monterrey",      md:3 },
  { id:51, date:"2026-06-24", time:"3:00 PM", group:"B", home:"Qatar",          homeF:"🇶🇦", away:"Bosnia-Herz.",    awayF:"🇧🇦", venue:"Vancouver",      md:3 },
  { id:52, date:"2026-06-24", time:"3:00 PM", group:"B", home:"Suiza",          homeF:"🇨🇭", away:"Canadá",          awayF:"🇨🇦", venue:"Seattle",        md:3 },
  { id:53, date:"2026-06-24", time:"6:00 PM", group:"C", home:"Marruecos",      homeF:"🇲🇦", away:"Haití",           awayF:"🇭🇹", venue:"Miami",          md:3 },
  { id:54, date:"2026-06-24", time:"6:00 PM", group:"C", home:"Escocia",        homeF:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", away:"Brasil",          awayF:"🇧🇷", venue:"Atlanta",        md:3 },
  { id:55, date:"2026-06-25", time:"10:00 PM",group:"D", home:"Paraguay",       homeF:"🇵🇾", away:"Australia",       awayF:"🇦🇺", venue:"San Francisco",  md:3 },
  { id:56, date:"2026-06-25", time:"10:00 PM",group:"D", home:"Turquía",        homeF:"🇹🇷", away:"Estados Unidos",  awayF:"🇺🇸", venue:"Los Angeles",    md:3 },
  { id:57, date:"2026-06-25", time:"4:00 PM", group:"E", home:"Alemania",       homeF:"🇩🇪", away:"Ecuador",         awayF:"🇪🇨", venue:"Philadelphia",   md:3 },
  { id:58, date:"2026-06-25", time:"4:00 PM", group:"E", home:"Costa de Marfil",homeF:"🇨🇮", away:"Curazao",         awayF:"🇨🇼", venue:"New York/NJ",    md:3 },
  { id:60, date:"2026-06-25", time:"7:00 PM", group:"F", home:"Japón",          homeF:"🇯🇵", away:"Suecia",          awayF:"🇸🇪", venue:"Dallas",         md:3 },
  { id:61, date:"2026-06-25", time:"7:00 PM", group:"F", home:"Túnez",          homeF:"🇹🇳", away:"Países Bajos",    awayF:"🇳🇱", venue:"Kansas City",    md:3 },
  { id:62, date:"2026-06-26", time:"11:00 PM",group:"G", home:"Egipto",         homeF:"🇪🇬", away:"Irán",            awayF:"🇮🇷", venue:"Seattle",        md:3 },
  { id:63, date:"2026-06-26", time:"11:00 PM",group:"G", home:"Bélgica",        homeF:"🇧🇪", away:"Nueva Zelanda",   awayF:"🇳🇿", venue:"Vancouver",      md:3 },
  { id:64, date:"2026-06-26", time:"8:00 PM", group:"H", home:"España",         homeF:"🇪🇸", away:"Uruguay",         awayF:"🇺🇾", venue:"Houston",        md:3 },
  { id:65, date:"2026-06-26", time:"8:00 PM", group:"H", home:"Cabo Verde",     homeF:"🇨🇻", away:"Arabia Saudita",  awayF:"🇸🇦", venue:"Guadalajara",    md:3 },
  { id:66, date:"2026-06-26", time:"3:00 PM", group:"I", home:"Senegal",        homeF:"🇸🇳", away:"Irak",            awayF:"🇮🇶", venue:"Boston",         md:3 },
  { id:67, date:"2026-06-26", time:"3:00 PM", group:"I", home:"Noruega",        homeF:"🇳🇴", away:"Francia",         awayF:"🇫🇷", venue:"Toronto",        md:3 },
  { id:59, date:"2026-06-27", time:"7:30 PM", group:"K", home:"R.D. Congo",     homeF:"🇨🇩", away:"Uzbekistán",      awayF:"🇺🇿", venue:"Miami",          md:3 },
  { id:70, date:"2026-06-27", time:"7:30 PM", group:"K", home:"Colombia",       homeF:"🇨🇴", away:"Portugal",        awayF:"🇵🇹", venue:"Atlanta",        md:3 },
  { id:68, date:"2026-06-27", time:"10:00 PM",group:"J", home:"Argelia",        homeF:"🇩🇿", away:"Austria",         awayF:"🇦🇹", venue:"Kansas City",    md:3 },
  { id:69, date:"2026-06-27", time:"10:00 PM",group:"J", home:"Jordania",       homeF:"🇯🇴", away:"Argentina",       awayF:"🇦🇷", venue:"Dallas",         md:3 },
  { id:71, date:"2026-06-27", time:"5:00 PM", group:"L", home:"Ghana",          homeF:"🇬🇭", away:"Croacia",         awayF:"🇭🇷", venue:"Philadelphia",   md:3 },
  { id:72, date:"2026-06-27", time:"5:00 PM", group:"L", home:"Panamá",         homeF:"🇵🇦", away:"Inglaterra",      awayF:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", venue:"New York/NJ",    md:3 },
  // ELIMINATORIAS (Octavos)
  { id:74, date:"2026-06-28", time:"3:00 PM",  group:"KO", home:"1A",  homeF:"⚽", away:"2B",  awayF:"⚽", venue:"SoFi Stadium, LA",   md:0, round:"R32" },
  { id:75, date:"2026-06-29", time:"1:00 PM",  group:"KO", home:"1C",  homeF:"⚽", away:"2F",  awayF:"⚽", venue:"NRG Houston",         md:0, round:"R32" },
  { id:76, date:"2026-06-29", time:"4:30 PM",  group:"KO", home:"1E",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"Gillette, Boston",    md:0, round:"R32" },
  { id:77, date:"2026-06-29", time:"9:00 PM",  group:"KO", home:"1F",  homeF:"⚽", away:"2C",  awayF:"⚽", venue:"BBVA, Monterrey",     md:0, round:"R32" },
  { id:78, date:"2026-06-30", time:"1:00 PM",  group:"KO", home:"2E",  homeF:"⚽", away:"2I",  awayF:"⚽", venue:"AT&T, Dallas",        md:0, round:"R32" },
  { id:79, date:"2026-06-30", time:"5:00 PM",  group:"KO", home:"1I",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"MetLife, NJ",         md:0, round:"R32" },
  { id:80, date:"2026-06-30", time:"9:00 PM",  group:"KO", home:"3rd", homeF:"⚽", away:"3rd", awayF:"⚽", venue:"Azteca, Mex City",    md:0, round:"R32" },
  { id:81, date:"2026-07-01", time:"12:00 PM", group:"KO", home:"1L",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"Benz, Atlanta",       md:0, round:"R32" },
  { id:82, date:"2026-07-01", time:"4:00 PM",  group:"KO", home:"1G",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"Lumen, Seattle",      md:0, round:"R32" },
  { id:83, date:"2026-07-01", time:"8:00 PM",  group:"KO", home:"1D",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"Levi's, S.F.",        md:0, round:"R32" },
  { id:84, date:"2026-07-02", time:"3:00 PM",  group:"KO", home:"1H",  homeF:"⚽", away:"2J",  awayF:"⚽", venue:"SoFi Stadium, LA",    md:0, round:"R32" },
  { id:85, date:"2026-07-02", time:"7:00 PM",  group:"KO", home:"2K",  homeF:"⚽", away:"2L",  awayF:"⚽", venue:"BMO, Toronto",        md:0, round:"R32" },
  { id:86, date:"2026-07-02", time:"11:00 PM", group:"KO", home:"1B",  homeF:"⚽", away:"3rd", awayF:"⚽", venue:"BC Place, Vancouver", md:0, round:"R32" },
  { id:87, date:"2026-07-03", time:"2:00 PM",  group:"KO", home:"2D",  homeF:"⚽", away:"2G",  awayF:"⚽", venue:"Arrowhead, KC",       md:0, round:"R32" },
  { id:88, date:"2026-07-03", time:"7:00 PM",  group:"KO", home:"2H",  homeF:"⚽", away:"2A",  awayF:"⚽", venue:"Hard Rock, Miami",    md:0, round:"R32" },
  { id:89, date:"2026-07-04", time:"3:00 PM",  group:"KO", home:"1J",  homeF:"⚽", away:"1K",  awayF:"⚽", venue:"AT&T, Dallas",        md:0, round:"R32" },
  // Cuartos
  { id:90, date:"2026-07-07", time:"3:00 PM",  group:"KO", home:"W74", homeF:"⚽", away:"W75", awayF:"⚽", venue:"MetLife, NJ",         md:0, round:"QF" },
  { id:91, date:"2026-07-07", time:"7:00 PM",  group:"KO", home:"W76", homeF:"⚽", away:"W77", awayF:"⚽", venue:"SoFi, LA",            md:0, round:"QF" },
  { id:92, date:"2026-07-08", time:"3:00 PM",  group:"KO", home:"W78", homeF:"⚽", away:"W79", awayF:"⚽", venue:"Arrowhead, KC",       md:0, round:"QF" },
  { id:93, date:"2026-07-08", time:"7:00 PM",  group:"KO", home:"W80", homeF:"⚽", away:"W81", awayF:"⚽", venue:"AT&T, Dallas",        md:0, round:"QF" },
  { id:94, date:"2026-07-09", time:"3:00 PM",  group:"KO", home:"W82", homeF:"⚽", away:"W83", awayF:"⚽", venue:"Azteca, Mex City",    md:0, round:"QF" },
  { id:95, date:"2026-07-09", time:"7:00 PM",  group:"KO", home:"W84", homeF:"⚽", away:"W85", awayF:"⚽", venue:"NRG, Houston",        md:0, round:"QF" },
  { id:96, date:"2026-07-10", time:"3:00 PM",  group:"KO", home:"W86", homeF:"⚽", away:"W87", awayF:"⚽", venue:"Levi's, S.F.",        md:0, round:"QF" },
  { id:97, date:"2026-07-10", time:"7:00 PM",  group:"KO", home:"W88", homeF:"⚽", away:"W89", awayF:"⚽", venue:"BC Place, Vancouver", md:0, round:"QF" },
  // Semis
  { id:98, date:"2026-07-14", time:"3:00 PM",  group:"KO", home:"W90", homeF:"⚽", away:"W91", awayF:"⚽", venue:"MetLife, NJ",         md:0, round:"SF" },
  { id:99, date:"2026-07-14", time:"7:00 PM",  group:"KO", home:"W92", homeF:"⚽", away:"W93", awayF:"⚽", venue:"AT&T, Dallas",        md:0, round:"SF" },
  { id:100,date:"2026-07-15", time:"3:00 PM",  group:"KO", home:"W94", homeF:"⚽", away:"W95", awayF:"⚽", venue:"SoFi, LA",            md:0, round:"SF" },
  { id:101,date:"2026-07-15", time:"7:00 PM",  group:"KO", home:"W96", homeF:"⚽", away:"W97", awayF:"⚽", venue:"Azteca, Mex City",    md:0, round:"SF" },
  // Final
  { id:102,date:"2026-07-19", time:"3:00 PM",  group:"KO", home:"W98/99",homeF:"🏆", away:"W100/101",awayF:"🏆", venue:"MetLife, NJ", md:0, round:"FINAL" },
];

// ── INITIAL GROUP DATA ────────────────────────────────────────────────────────
const GROUPS_DATA = {
  A: { teams: ["México", "Corea del Sur", "Sudáfrica", "Chequia"],                flag: ["🇲🇽", "🇰🇷", "🇿🇦", "🇨🇿"] },
  B: { teams: ["Canadá", "Suiza", "Qatar", "Bosnia-Herz."],                       flag: ["🇨🇦", "🇨🇭", "🇶🇦", "🇧🇦"] },
  C: { teams: ["Brasil", "Marruecos", "Haití", "Escocia"],                        flag: ["🇧🇷", "🇲🇦", "🇭🇹", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"] },
  D: { teams: ["Estados Unidos", "Paraguay", "Australia", "Turquía"],             flag: ["🇺🇸", "🇵🇾", "🇦🇺", "🇹🇷"] },
  E: { teams: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],              flag: ["🇩🇪", "🇨🇼", "🇨🇮", "🇪🇨"] },
  F: { teams: ["Países Bajos", "Japón", "Suecia", "Túnez"],                       flag: ["🇳🇱", "🇯🇵", "🇸🇪", "🇹🇳"] },
  G: { teams: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],                     flag: ["🇧🇪", "🇪🇬", "🇮🇷", "🇳🇿"] },
  H: { teams: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],              flag: ["🇪🇸", "🇨🇻", "🇸🇦", "🇺🇾"] },
  I: { teams: ["Francia", "Senegal", "Irak", "Noruega"],                          flag: ["🇫🇷", "🇸🇳", "🇮🇶", "🇳🇴"] },
  J: { teams: ["Argentina", "Argelia", "Austria", "Jordania"],                    flag: ["🇦🇷", "🇩🇿", "🇦🇹", "🇯🇴"] },
  K: { teams: ["Portugal", "R.D. Congo", "Uzbekistán", "Colombia"],               flag: ["🇵🇹", "🇨🇩", "🇺🇿", "🇨🇴"] },
  L: { teams: ["Inglaterra", "Croacia", "Ghana", "Panamá"],                       flag: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇭🇷", "🇬🇭", "🇵🇦"] },
};

function initGroupMatches(teams, flags) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `${teams[i]}-${teams[j]}`,
        home: teams[i], homeFlag: flags[i],
        away: teams[j], awayFlag: flags[j],
        homeScore: null, awayScore: null,
        played: false, editing: false,
        tempHome: "", tempAway: "",
      });
    }
  }
  return matches;
}

// Compute head-to-head stats among a subset of teams using only their mutual matches
function computeH2H(teamSubset, matches, scheduleScores) {
  const h = {};
  teamSubset.forEach(t => { h[t] = { pts: 0, gf: 0, gc: 0, dg: 0 }; });
  matches.forEach(m => {
    if (!teamSubset.includes(m.home) || !teamSubset.includes(m.away)) return;
    const sched = SCHEDULE_BY_TEAMS[`${m.home}|${m.away}`];
    const ss = sched ? scheduleScores?.[sched.id] : null;
    if (!ss?.played) return;
    const flipped = sched && sched.home !== m.home;
    const hg = flipped ? Number(ss.a) : Number(ss.h);
    const ag = flipped ? Number(ss.h) : Number(ss.a);
    h[m.home].gf += hg; h[m.home].gc += ag; h[m.home].dg += hg - ag;
    h[m.away].gf += ag; h[m.away].gc += hg; h[m.away].dg += ag - hg;
    if (hg > ag)       { h[m.home].pts += 3; }
    else if (hg === ag){ h[m.home].pts += 1; h[m.away].pts += 1; }
    else               { h[m.away].pts += 3; }
  });
  return h;
}

// FIFA 2026 group tiebreaker: H2H pts → H2H GD → H2H GF → Overall GD → Overall GF
function computeStandings(matches, teams, flags, scheduleScores) {
  const stats = {};
  teams.forEach((t, i) => {
    stats[t] = { name: t, flag: flags[i], pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });
  matches.forEach(m => {
    const sched = SCHEDULE_BY_TEAMS[`${m.home}|${m.away}`];
    const ss = sched ? scheduleScores?.[sched.id] : null;
    if (!ss?.played) return;
    const h = stats[m.home], a = stats[m.away];
    const flipped = sched && sched.home !== m.home;
    const hg = flipped ? Number(ss.a) : Number(ss.h);
    const ag = flipped ? Number(ss.h) : Number(ss.a);
    h.pj++; a.pj++;
    h.gf += hg; h.gc += ag;
    a.gf += ag; a.gc += hg;
    h.dg = h.gf - h.gc; a.dg = a.gf - a.gc;
    if (hg > ag) { h.pg++; h.pts += 3; a.pp++; }
    else if (hg === ag) { h.pe++; h.pts += 1; a.pe++; a.pts += 1; }
    else { a.pg++; a.pts += 3; h.pp++; }
  });

  const arr = Object.values(stats);

  // Multi-pass sort with FIFA 2026 H2H tiebreaker
  arr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    // H2H between these two teams
    const h2h = computeH2H([a.name, b.name], matches, scheduleScores);
    const hA = h2h[a.name], hB = h2h[b.name];
    if (hA.pts !== hB.pts) return hB.pts - hA.pts;
    if (hA.dg  !== hB.dg)  return hB.dg  - hA.dg;
    if (hA.gf  !== hB.gf)  return hB.gf  - hA.gf;
    // Fall back to overall
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  });

  return arr;
}

// Rank all 12 third-place teams across groups (criteria: pts → GD → GF → name)
// Returns array sorted best→worst, each entry has .advances = true if top 8
function computeBestThirds(standings) {
  const thirds = Object.entries(standings)
    .map(([group, st]) => st.length >= 3 ? { ...st[2], group } : null)
    .filter(Boolean);
  thirds.sort((a, b) =>
    b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.name.localeCompare(b.name)
  );
  return thirds.map((t, i) => ({ ...t, advances: i < 8 }));
}

// ── SCHEDULE LOOKUP (by "home|away") ─────────────────────────────────────────
const SCHEDULE_BY_TEAMS = {};
SCHEDULE.forEach(m => {
  SCHEDULE_BY_TEAMS[`${m.home}|${m.away}`] = m;
  SCHEDULE_BY_TEAMS[`${m.away}|${m.home}`] = m; // both directions
});

// ── LIVE MATCH HELPERS ────────────────────────────────────────────────────────
function parseETTime(str) {
  const [t, p] = str.trim().split(' ');
  let [h, m] = t.split(':').map(Number);
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return { h, m };
}

// World Cup Jun-Jul 2026 runs in EDT = UTC-4
function parseMatchDate(dateStr, timeStr) {
  const { h, m } = parseETTime(timeStr);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, h + 4, m, 0));
}

function formatLocalTime(dateStr, timeStr) {
  return parseMatchDate(dateStr, timeStr)
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getLiveStatus(match) {
  if (!match.date || !match.time) return null;
  const now = new Date();
  const start = parseMatchDate(match.date, match.time);
  const elapsed = Math.floor((now - start) / 60000);
  if (elapsed < -60 || elapsed >= 120) return null;
  if (elapsed < 0) return { phase: 'soon', label: 'Pronto ⏰', pct: 0 };
  if (elapsed <= 45) return { phase: 'live', label: `${elapsed}'`, pct: elapsed / 90 };
  if (elapsed <= 47) return { phase: 'live', label: 'MT', pct: 0.5 };
  if (elapsed <= 93) return { phase: 'live', label: `${Math.min(90, elapsed - 2)}'`, pct: Math.min(90, elapsed - 2) / 90 };
  return { phase: 'live', label: 'FT', pct: 1 };
}

const ANIM_STYLE = `@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.5)}}`;

const OFFICIAL_LINKS = [
  { name:"FIFA+",      url:"https://www.fifa.com/fifaplus",    official:true,  region:"Global",         subscription:false, note:"Plataforma oficial FIFA" },
  { name:"Fox Sports", url:"https://www.foxsports.com",        official:true,  region:"EE.UU.",         subscription:false, note:"Derechos en EE.UU." },
  { name:"Peacock",    url:"https://www.peacocktv.com",        official:true,  region:"EE.UU.",         subscription:true,  note:"Streaming premium" },
  { name:"ViX",        url:"https://www.vix.com",              official:true,  region:"EE.UU./México",  subscription:true,  note:"En español" },
  { name:"TV Azteca",  url:"https://www.tvazteca.com",         official:true,  region:"México",         subscription:false, note:"Gratuito en México" },
  { name:"TUDN",       url:"https://www.tudn.com",             official:true,  region:"México/EE.UU.", subscription:false, note:"Univisión Deportes" },
  { name:"TSN",        url:"https://www.tsn.ca",               official:true,  region:"Canadá",         subscription:true,  note:"English" },
  { name:"CTV",        url:"https://www.ctv.ca",               official:true,  region:"Canadá",         subscription:false, note:"Gratuito" },
  { name:"BBC iPlayer",url:"https://www.bbc.co.uk/iplayer",    official:true,  region:"Reino Unido",    subscription:false, note:"Solo UK" },
];

// Helper: short date label  e.g. "11 Jun" / "Jun 11"
function shortDate(dateStr, lang) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day:"numeric", month:"short" });
}

// ── GROUP COLOR MAP ────────────────────────────────────────────────────────────
const GROUP_COLORS = {
  A:"#E61D25", B:"#2A398D", C:"#3CAC3B", D:"#FF8C00",
  E:"#9B59B6", F:"#00A8CC", G:"#E91E63", H:"#FFD700",
  I:"#00BCD4", J:"#8BC34A", K:"#FF5722", L:"#607D8B", KO:"#FFD700",
};

// ── R32 SLOT ORDER (sorted by date/time, same order as knockout.r32 array) ───
const R32_SCHED_SLOTS = SCHEDULE
  .filter(m => m.group === "KO" && m.round === "R32")
  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

// Map each KO schedule match id → { stateKey, idx } in knockout state
const KO_SCHED_TO_SLOT = (() => {
  const map = {};
  const keys = { R32:'r32', QF:'r16', SF:'semi', FINAL:'final' };
  Object.entries(keys).forEach(([round, sk]) => {
    SCHEDULE
      .filter(m => m.group === 'KO' && m.round === round)
      .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .forEach((slot, i) => { map[slot.id] = { stateKey: sk, idx: i }; });
  });
  return map;
})();

// All 48 countries sorted alphabetically for the team picker
const ALL_COUNTRIES = Object.values(GROUPS_DATA)
  .flatMap(g => g.teams.map((name, i) => ({ name, flag: g.flag[i] })))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function MundialApp() {
  const [lang, setLang] = useState("es");
  const t = T[lang];
  const [activeTab, setActiveTab] = useState("calendar");
  const [notification, setNotification] = useState("");

  const [groupMatches, setGroupMatches] = useState(() => {
    const gm = {};
    Object.entries(GROUPS_DATA).forEach(([g, d]) => { gm[g] = initGroupMatches(d.teams, d.flag); });
    return gm;
  });

  const KO_DEFAULT = {
    r32:  Array(16).fill(null).map((_,i)=>({ id:i, team1:null, team2:null, score1:null, score2:null, played:false })),
    r16:  Array(8).fill(null).map((_,i) =>({ id:i, team1:null, team2:null, score1:null, score2:null, played:false })),
    semi: Array(4).fill(null).map((_,i) =>({ id:i, team1:null, team2:null, score1:null, score2:null, played:false })),
    final:[{ id:0, team1:null, team2:null, score1:null, score2:null, played:false }],
    champion: null,
  };
  const [knockout, setKnockout] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wc26_ko') || '{}');
      return {
        r32:      saved.r32      ?? KO_DEFAULT.r32,
        r16:      saved.r16      ?? KO_DEFAULT.r16,
        semi:     saved.semi     ?? KO_DEFAULT.semi,
        final:    saved.final    ?? KO_DEFAULT.final,
        champion: saved.champion ?? null,
      };
    } catch { return KO_DEFAULT; }
  });

  useEffect(() => {
    try { localStorage.setItem('wc26_ko', JSON.stringify(knockout)); } catch {}
  }, [knockout]);

  const [selectedGroup, setSelectedGroup] = useState("A");

  // Calendar filters
  const [calFilter, setCalFilter] = useState("all"); // all | upcoming | played
  const [calGroup, setCalGroup]   = useState("all"); // all | A-L | KO
  const [calMd,    setCalMd]      = useState("all"); // all | 1 | 2 | 3 | KO

  // Streaming modal + live ticker
  const [streamModal, setStreamModal] = useState(null);

  // Team picker modal
  const [teamPicker, setTeamPicker] = useState(null); // { stateKey, idx, side:'team1'|'team2' }
  function pickTeam(flag, name) {
    if (!teamPicker) return;
    const { stateKey, idx, side } = teamPicker;
    setKnockout(prev => {
      const arr = prev[stateKey].map((m, i) =>
        i === idx ? { ...m, [side]: `${flag} ${name}` } : m
      );
      return { ...prev, [stateKey]: arr };
    });
    setTeamPicker(null);
  }
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('wc26_ak') || '');

  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLiveTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const liveFetchRef = useRef({ inProgress: false, lastFetch: 0 });

  useEffect(() => {
    const liveNow = SCHEDULE.filter(m => m.group !== 'KO' && getLiveStatus(m));
    if (!liveNow.length || !apiKey.trim()) return;

    const now = Date.now();
    if (liveFetchRef.current.inProgress || now - liveFetchRef.current.lastFetch < 60000) return;
    liveFetchRef.current.inProgress = true;
    liveFetchRef.current.lastFetch = now;

    (async () => {
      try {
        const matchList = liveNow.map(m => `${m.home} vs ${m.away}`).join(', ');
        let messages = [{
          role: "user",
          content: `Search the web for the CURRENT live scores of these FIFA World Cup 2026 matches being played RIGHT NOW: ${matchList}. Return ONLY a JSON array: [{"home":"exact team name","away":"exact team name","homeScore":N,"awayScore":N}]. JSON only, no text.`
        }];
        const headers = {
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        };
        let finalText = "";
        for (let iter = 0; iter < 6; iter++) {
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers,
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 512, tools: [{ type: "web_search", name: "web_search" }], messages })
          });
          if (!resp.ok) break;
          const data = await resp.json();
          const textBlock = data.content?.find(b => b.type === 'text');
          if (data.stop_reason === 'end_turn' && textBlock) { finalText = textBlock.text; break; }
          if (data.stop_reason === 'tool_use') {
            messages = [...messages,
              { role: 'assistant', content: data.content },
              { role: 'user', content: data.content.filter(b => b.type === 'tool_use').map(b => ({ type: 'tool_result', tool_use_id: b.id, content: '' })) }
            ];
            continue;
          }
          if (textBlock) finalText = textBlock.text;
          break;
        }
        if (!finalText) return;
        const jsonMatch = finalText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return;
        JSON.parse(jsonMatch[0]).forEach(r => {
          const m = SCHEDULE.find(s =>
            (s.home === r.home && s.away === r.away) || (s.home === r.away && s.away === r.home)
          );
          if (!m || r.homeScore == null || r.awayScore == null) return;
          const flipped = m.home === r.away;
          const h = flipped ? Number(r.awayScore) : Number(r.homeScore);
          const a = flipped ? Number(r.homeScore) : Number(r.awayScore);
          setScheduleScores(prev => ({
            ...prev,
            [m.id]: { ...prev[m.id], h, a, live: true, editing: false }
          }));
        });
      } catch (_) {
        // silent — auto-fetch failure no debe molestar al usuario
      } finally {
        liveFetchRef.current.inProgress = false;
      }
    })();
  }, [liveTick, apiKey]);

  // Schedule scores state — persisted in localStorage
  const [scheduleScores, setScheduleScores] = useState(() => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('wc26_scores') || '{}'); } catch {}
    const s = {};
    SCHEDULE.forEach(m => {
      const stored = saved[m.id];
      s[m.id] = stored
        ? { h: stored.h ?? "", a: stored.a ?? "", played: !!stored.played, editing: false }
        : { h: "", a: "", played: false, editing: false };
    });
    return s;
  });

  useEffect(() => {
    try { localStorage.setItem('wc26_scores', JSON.stringify(scheduleScores)); } catch {}
  }, [scheduleScores]);

  // Auto-populate r32 knockout slots when groups finish
  useEffect(() => {
    setKnockout(prev => {
      const updatedR32 = prev.r32.map(m => ({ ...m }));
      let changed = false;

      // ── 1st & 2nd place: populate as each group completes ─────────────────
      Object.keys(GROUPS_DATA).forEach(groupId => {
        const groupSched = SCHEDULE.filter(m => m.group === groupId);
        const allPlayed = groupSched.length > 0 && groupSched.every(m => scheduleScores[m.id]?.played);
        if (!allPlayed) return;

        const gd = GROUPS_DATA[groupId];
        const gStandings = computeStandings(groupMatches[groupId], gd.teams, gd.flag, scheduleScores);
        if (gStandings.length < 2) return;

        const teamByPos = { "1": gStandings[0], "2": gStandings[1] };

        R32_SCHED_SLOTS.forEach((slot, i) => {
          if (i >= updatedR32.length) return;
          [["home", "team1"], ["away", "team2"]].forEach(([side, teamField]) => {
            const label = slot[side];
            if (label && label.length === 2 && label[1] === groupId) {
              const team = teamByPos[label[0]];
              if (team) {
                const newStr = `${team.flag} ${team.name}`;
                if (updatedR32[i][teamField] !== newStr) {
                  updatedR32[i] = { ...updatedR32[i], [teamField]: newStr };
                  changed = true;
                }
              }
            }
          });
        });
      });

      // ── 3rd place slots: only when ALL 12 groups are complete ─────────────
      const allGroupsDone = Object.keys(GROUPS_DATA).every(gId => {
        const gs = SCHEDULE.filter(m => m.group === gId);
        return gs.length > 0 && gs.every(m => scheduleScores[m.id]?.played);
      });

      if (allGroupsDone) {
        const allStandings = {};
        Object.keys(GROUPS_DATA).forEach(gId => {
          const gd = GROUPS_DATA[gId];
          allStandings[gId] = computeStandings(groupMatches[gId], gd.teams, gd.flag, scheduleScores);
        });
        const bestThirds = computeBestThirds(allStandings).filter(t => t.advances);

        // Assign top-8 thirds sequentially to "3rd" r32 slots (in slot date order)
        let thirdIdx = 0;
        R32_SCHED_SLOTS.forEach((slot, i) => {
          if (i >= updatedR32.length || thirdIdx >= bestThirds.length) return;
          [["home", "team1"], ["away", "team2"]].forEach(([side, teamField]) => {
            if (slot[side] === "3rd" && thirdIdx < bestThirds.length) {
              const team = bestThirds[thirdIdx++];
              const newStr = `${team.flag} ${team.name}`;
              if (updatedR32[i][teamField] !== newStr) {
                updatedR32[i] = { ...updatedR32[i], [teamField]: newStr };
                changed = true;
              }
            }
          });
        });
      }

      return changed ? { ...prev, r32: updatedR32 } : prev;
    });
  }, [scheduleScores, groupMatches]);

  function notify(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }

  const standings = {};
  Object.entries(groupMatches).forEach(([g, matches]) => {
    standings[g] = computeStandings(matches, GROUPS_DATA[g].teams, GROUPS_DATA[g].flag, scheduleScores);
  });

  // Best third-place teams ranking (all 12 groups)
  const bestThirds = computeBestThirds(standings);
  // Which 3rd-place teams currently qualify (set of team names)
  const qualifiedThirds = new Set(bestThirds.filter(t => t.advances).map(t => t.name));

  function saveGroupMatch(groupId, matchId, homeScore, awayScore) {
    const match = groupMatches[groupId].find(m => m.id === matchId);
    const sched = SCHEDULE_BY_TEAMS[`${match.home}|${match.away}`];
    if (sched) {
      const flipped = sched.home !== match.home;
      setScheduleScores(prev => ({
        ...prev,
        [sched.id]: { h: flipped ? awayScore : homeScore, a: flipped ? homeScore : awayScore, played: true, editing: false }
      }));
    }
    setGroupMatches(prev => {
      const gm = { ...prev };
      gm[groupId] = gm[groupId].map(m =>
        m.id !== matchId ? m : { ...m, editing: false }
      );
      return gm;
    });
  }

  function startEdit(groupId, matchId) {
    setGroupMatches(prev => {
      const gm = { ...prev };
      gm[groupId] = gm[groupId].map(m => {
        if (m.id !== matchId) return m;
        const sched = SCHEDULE_BY_TEAMS[`${m.home}|${m.away}`];
        const ss = sched ? scheduleScores[sched.id] : null;
        const flipped = sched && sched.home !== m.home;
        return { ...m, editing: true, tempHome: (flipped ? ss?.a : ss?.h) ?? '', tempAway: (flipped ? ss?.h : ss?.a) ?? '' };
      });
      return gm;
    });
  }

  // r32[i] → r16[⌊i/2⌋], r16[i] → semi[⌊i/2⌋], semi[0|1] → final.team1, semi[2|3] → final.team2
  function propagateWinner(roundKey, i, winner) {
    const next = { r32:'r16', r16:'semi', semi:'final' }[roundKey];
    if (!next || !winner) return;
    setKnockout(prev => {
      const upd = { ...prev };
      if (next === 'final') {
        const slot = { ...upd.final[0] };
        if (i < 2) slot.team1 = winner; else slot.team2 = winner;
        upd.final = [slot];
      } else {
        const arr = [...upd[next]];
        const slot = { ...arr[Math.floor(i / 2)] };
        if (i % 2 === 0) slot.team1 = winner; else slot.team2 = winner;
        arr[Math.floor(i / 2)] = slot;
        upd[next] = arr;
      }
      return upd;
    });
  }

  function doReset() {
    if (!window.confirm(t.confirmReset)) return;
    setGroupMatches(() => {
      const gm = {};
      Object.entries(GROUPS_DATA).forEach(([g, d]) => { gm[g] = initGroupMatches(d.teams, d.flag); });
      return gm;
    });
    setScheduleScores(() => {
      const s = {};
      SCHEDULE.forEach(m => { s[m.id] = { h:"", a:"", played:false, editing:false }; });
      return s;
    });
    setKnockout(KO_DEFAULT);
    try { localStorage.removeItem('wc26_ko'); } catch {}
    notify("✓ Reset");
  }

  // ── Calendar filtering ──────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  const _tick = liveTick; // forces re-render for live status
  const _now = new Date();
  const TODAY = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
  const liveMatches = SCHEDULE.filter(m => m.group !== 'KO' && getLiveStatus(m));
  const filteredSchedule = SCHEDULE.filter(m => {
    const ss = scheduleScores[m.id];
    if (calFilter === "played"   && !ss.played) return false;
    if (calFilter === "upcoming" && ss.played)  return false;
    if (calGroup !== "all" && m.group !== calGroup) return false;
    if (calMd === "1" && m.md !== 1) return false;
    if (calMd === "2" && m.md !== 2) return false;
    if (calMd === "3" && m.md !== 3) return false;
    if (calMd === "KO" && m.group !== "KO") return false;
    return true;
  });

  // Group by date
  const byDate = {};
  filteredSchedule.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });

  const ROUND_LABELS = { R32: t.round32, QF: t.round16, SF: t.semis, FINAL: t.final };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.bgPattern} />
      {notification && <div style={S.notif}>{notification}</div>}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.hTop}>
          <div style={S.logo}>
            <span style={S.logoIcon}>⚽</span>
            <div>
              <div style={S.logoTitle}>{t.title}</div>
            </div>
          </div>
          <div style={S.hCtrls}>
            <button style={S.langBtn} onClick={() => setLang(l => l==="es"?"en":"es")}>
              {lang==="es"?"🇺🇸 EN":"🇪🇸 ES"}
            </button>

            <button style={S.resetBtn} onClick={doReset}>↺</button>
          </div>
        </div>
        <nav style={S.tabs}>
          {[
            { key:"calendar", label:t.calendar, icon:"📅" },
            { key:"groups",   label:t.groups,   icon:"▦"  },
            { key:"knockout", label:t.knockout, icon:"🏆" },
          ].map(tab => (
            <button key={tab.key}
              style={{ ...S.tab, ...(activeTab===tab.key ? S.tabA : {}) }}
              onClick={() => setActiveTab(tab.key)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={S.main}>

        {/* ── CALENDAR TAB ─────────────────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div>
            {/* Filter bar */}
            <div style={S.filterBar}>
              {/* Status filter */}
              <div style={S.filterRow}>
                {["all","upcoming","played"].map(f => (
                  <button key={f} style={{ ...S.filterBtn, ...(calFilter===f?S.filterBtnA:{}) }}
                    onClick={() => setCalFilter(f)}>
                    {f==="all" ? t.allMatches : f==="upcoming" ? t.upcoming : t.played}
                  </button>
                ))}
              </div>
              {/* Matchday filter */}
              <div style={S.filterRow}>
                {["all","1","2","3","KO"].map(f => (
                  <button key={f} style={{ ...S.filterBtn, ...(calMd===f?S.filterBtnA:{}) }}
                    onClick={() => setCalMd(f)}>
                    {f==="all"?"All" : f==="KO"?"Elim." : `J${f}`}
                  </button>
                ))}
              </div>
              {/* Group filter */}
              <div style={{ ...S.filterRow, flexWrap:"wrap" }}>
                <button style={{ ...S.filterBtn, ...(calGroup==="all"?S.filterBtnA:{}) }}
                  onClick={() => setCalGroup("all")}>Todos</button>
                {[...Object.keys(GROUPS_DATA),"KO"].map(g => (
                  <button key={g}
                    style={{ ...S.filterBtn, ...(calGroup===g?{ background:GROUP_COLORS[g], color:"#fff", border:"none" }:{}) }}
                    onClick={() => setCalGroup(g)}>{g}</button>
                ))}
              </div>
            </div>

            {/* Live matches banner */}
            <LiveBanner liveMatches={liveMatches} scheduleScores={scheduleScores} onStream={setStreamModal} />

            {/* Match cards by date */}
            {Object.keys(byDate).sort().map(date => (
              <div key={date}>
                <DateHeader date={date} today={TODAY} lang={lang} />
                {byDate[date].map(match => {
                  const koSlot = match.group === 'KO' ? KO_SCHED_TO_SLOT[match.id] : null;
                  const koMatch = koSlot ? knockout[koSlot.stateKey]?.[koSlot.idx] : null;
                  return (
                  <CalendarMatchCard
                    key={match.id}
                    match={match}
                    ss={scheduleScores[match.id]}
                    t={t}
                    groupColor={GROUP_COLORS[match.group]}
                    roundLabel={match.round ? ROUND_LABELS[match.round] : `Grupo ${match.group} · J${match.md}`}
                    liveStatus={getLiveStatus(match)}
                    resolvedHome={koMatch?.team1 || null}
                    resolvedAway={koMatch?.team2 || null}
                    onPickHome={koSlot ? () => setTeamPicker({ stateKey: koSlot.stateKey, idx: koSlot.idx, side: 'team1' }) : null}
                    onPickAway={koSlot ? () => setTeamPicker({ stateKey: koSlot.stateKey, idx: koSlot.idx, side: 'team2' }) : null}
                    onEdit={() => setScheduleScores(prev => ({
                      ...prev, [match.id]: { ...prev[match.id], editing:true }
                    }))}
                    onSave={(h, a) => setScheduleScores(prev => ({
                      ...prev, [match.id]: { h, a, played:true, editing:false }
                    }))}
                    onChange={(field, val) => setScheduleScores(prev => ({
                      ...prev, [match.id]: { ...prev[match.id], [field]: val }
                    }))}
                    onStream={setStreamModal}
                  />
                  );
                })}
              </div>
            ))}

            {filteredSchedule.length === 0 && (
              <div style={S.empty}>No hay partidos con estos filtros</div>
            )}
          </div>
        )}

        {/* ── GROUPS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "groups" && (
          <div>
            <div style={S.groupSel}>
              {Object.keys(GROUPS_DATA).map(g => (
                <button key={g}
                  style={{ ...S.gTab, ...(selectedGroup===g?{ background:GROUP_COLORS[g], color:"#fff", border:`1px solid ${GROUP_COLORS[g]}` }:{}) }}
                  onClick={() => setSelectedGroup(g)}>{g}</button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Standings */}
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={{ ...S.badge, background:GROUP_COLORS[selectedGroup] }}>{t.group} {selectedGroup}</span>
                  <span style={S.cardTitle}>{GROUPS_DATA[selectedGroup].flag.join(" ")}</span>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>#</th>
                        <th style={{ ...S.th, textAlign:"left" }}>{t.team}</th>
                        <th style={S.th}>{t.pj}</th>
                        <th style={S.th}>{t.pg}</th>
                        <th style={S.th}>{t.pe}</th>
                        <th style={S.th}>{t.pp}</th>
                        <th style={S.th}>{t.gf}</th>
                        <th style={S.th}>{t.gc}</th>
                        <th style={S.th}>{t.dg}</th>
                        <th style={{ ...S.th, color:"#FFD700" }}>{t.pts}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings[selectedGroup].map((team, i) => {
                        const is3rdQual = i === 2 && qualifiedThirds.has(team.name);
                        const rowBg = i<2 ? "rgba(58,172,59,0.12)" : is3rdQual ? "rgba(0,188,212,0.10)" : i===2 ? "rgba(255,215,0,0.05)" : "transparent";
                        const posColor = i<2 ? "#3CAC3B" : is3rdQual ? "#00BCD4" : i===2 ? "#FFD700" : "#aaa";
                        return (
                        <tr key={team.name} style={{ background: rowBg }}>
                          <td style={{ ...S.td, color: posColor, fontWeight: i<3?700:400 }}>{i+1}</td>
                          <td style={{ ...S.td, textAlign:"left" }}><span style={{marginRight:5}}>{team.flag}</span>{team.name}</td>
                          <td style={S.td}>{team.pj}</td>
                          <td style={S.td}>{team.pg}</td>
                          <td style={S.td}>{team.pe}</td>
                          <td style={S.td}>{team.pp}</td>
                          <td style={S.td}>{team.gf}</td>
                          <td style={S.td}>{team.gc}</td>
                          <td style={{ ...S.td, color: team.dg>0?"#3CAC3B": team.dg<0?"#E61D25":"#aaa" }}>
                            {team.dg>0?`+${team.dg}`:team.dg}
                          </td>
                          <td style={{ ...S.td, fontWeight:900, color:"#FFD700", fontSize:15 }}>{team.pts}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:"6px 14px", fontSize:11, color:"#555", display:"flex", gap:14, flexWrap:"wrap" }}>
                  <span><span style={{color:"#3CAC3B"}}>■</span> 1°/2° Clasifica</span>
                  <span><span style={{color:"#00BCD4"}}>■</span> 3° Mejor Tercero ✓</span>
                  <span><span style={{color:"#FFD700"}}>■</span> 3° Pendiente</span>
                  <span style={{color:"#444", fontSize:10, marginLeft:"auto"}}>{t.tieNote}</span>
                </div>
              </div>

              {/* ── MEJORES TERCEROS ───────────────────────────────────────── */}
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={{ ...S.badge, background:"#00BCD4" }}>🏅 {t.bestThirds}</span>
                  <span style={{fontSize:11, color:"#555"}}>{t.advancesTop2}</span>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>#</th>
                        <th style={{ ...S.th, color:"#00BCD4" }}>{t.grp}</th>
                        <th style={{ ...S.th, textAlign:"left" }}>{t.team}</th>
                        <th style={S.th}>{t.pj}</th>
                        <th style={S.th}>{t.pg}</th>
                        <th style={S.th}>{t.pe}</th>
                        <th style={S.th}>{t.pp}</th>
                        <th style={S.th}>{t.gf}</th>
                        <th style={S.th}>{t.gc}</th>
                        <th style={S.th}>{t.dg}</th>
                        <th style={{ ...S.th, color:"#FFD700" }}>{t.pts}</th>
                        <th style={S.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestThirds.map((team, i) => (
                        <tr key={team.name} style={{ background: team.advances ? "rgba(0,188,212,0.10)" : "transparent" }}>
                          <td style={{ ...S.td, color: team.advances?"#00BCD4":"#555", fontWeight:700 }}>{i+1}</td>
                          <td style={{ ...S.td, color:GROUP_COLORS[team.group]||"#aaa", fontWeight:900 }}>{team.group}</td>
                          <td style={{ ...S.td, textAlign:"left" }}><span style={{marginRight:5}}>{team.flag}</span>{team.name}</td>
                          <td style={S.td}>{team.pj}</td>
                          <td style={S.td}>{team.pg}</td>
                          <td style={S.td}>{team.pe}</td>
                          <td style={S.td}>{team.pp}</td>
                          <td style={S.td}>{team.gf}</td>
                          <td style={S.td}>{team.gc}</td>
                          <td style={{ ...S.td, color: team.dg>0?"#3CAC3B": team.dg<0?"#E61D25":"#aaa" }}>
                            {team.dg>0?`+${team.dg}`:team.dg}
                          </td>
                          <td style={{ ...S.td, fontWeight:900, color:"#FFD700", fontSize:15 }}>{team.pts}</td>
                          <td style={{ ...S.td, fontSize:10, color: team.advances?"#00BCD4":"#444", fontWeight:700 }}>
                            {team.advances ? `✓ ${t.advances}` : `✗ ${t.notAdvances}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:"6px 14px", fontSize:10, color:"#444" }}>
                  {t.tieNote}
                </div>
              </div>

              {/* Group Matches */}
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardTitle}>Partidos del Grupo {selectedGroup}</span></div>
                {groupMatches[selectedGroup].map((match, idx) => {
                  const sched = SCHEDULE_BY_TEAMS[`${match.home}|${match.away}`];
                  const ss = sched ? scheduleScores[sched.id] : null;
                  const flippedDisp = sched && sched.home !== match.home;
                  const dispH = ss ? (flippedDisp ? ss.a : ss.h) : null;
                  const dispA = ss ? (flippedDisp ? ss.h : ss.a) : null;
                  return (
                  <div key={match.id} style={{ borderBottom: idx>0?"1px solid rgba(255,255,255,0.05)":"none", padding:"10px 14px" }}>
                    {/* Date/time chip */}
                    {sched && (
                      <div style={S.matchDateChip}>
                        <span style={S.matchDateDot} />
                        <span>{shortDate(sched.date, lang)}</span>
                        <span style={{color:"#555",margin:"0 4px"}}>·</span>
                        <span>{formatLocalTime(sched.date, sched.time)}</span>
                        <span style={{color:"#555",margin:"0 4px"}}>·</span>
                        <span style={{color:"#666"}}>📍 {sched.venue}</span>
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ flex:1, display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{fontSize:17}}>{match.homeFlag}</span>
                        <span style={{fontSize:11, color:"#ccc"}}>{match.home}</span>
                      </div>
                      <div style={{ minWidth:72, textAlign:"center" }}>
                        {ss?.played && !match.editing ? (
                          <span style={S.scoreDisp}>{dispH} – {dispA}</span>
                        ) : match.editing ? (
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <input style={S.sInput} type="number" min="0" max="20" value={match.tempHome}
                              onChange={e => setGroupMatches(prev => {
                                const gm={...prev}; gm[selectedGroup]=gm[selectedGroup].map(m=>m.id===match.id?{...m,tempHome:e.target.value}:m); return gm;
                              })} />
                            <span style={{color:"#FFD700"}}>–</span>
                            <input style={S.sInput} type="number" min="0" max="20" value={match.tempAway}
                              onChange={e => setGroupMatches(prev => {
                                const gm={...prev}; gm[selectedGroup]=gm[selectedGroup].map(m=>m.id===match.id?{...m,tempAway:e.target.value}:m); return gm;
                              })} />
                          </div>
                        ) : (
                          <span style={{color:"#555",fontSize:12}}>{t.vs}</span>
                        )}
                      </div>
                      <div style={{ flex:1, display:"flex", alignItems:"center", gap:5, flexDirection:"row-reverse" }}>
                        <span style={{fontSize:17}}>{match.awayFlag}</span>
                        <span style={{fontSize:11, color:"#ccc"}}>{match.away}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"center", marginTop:5 }}>
                      {match.editing ? (
                        <button style={S.btnSave} onClick={() => saveGroupMatch(selectedGroup, match.id, match.tempHome, match.tempAway)}>{t.saveScore}</button>
                      ) : ss?.played ? (
                        <button style={S.btnEdit} onClick={() => startEdit(selectedGroup, match.id)}>{t.editScore}</button>
                      ) : (
                        <button style={S.btnEdit} onClick={() => startEdit(selectedGroup, match.id)}>+ {t.score}</button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            <p style={{textAlign:"center",color:"#555",fontSize:11,marginTop:12}}>{t.advancesTop2}</p>
          </div>
        )}

        {/* ── KNOCKOUT TAB ─────────────────────────────────────────────────── */}
        {activeTab === "knockout" && (
          <KOBracket knockout={knockout} setKnockout={setKnockout} propagateWinner={propagateWinner} t={t} lang={lang} setTeamPicker={setTeamPicker} />
        )}


      </main>

      <footer style={S.footer}>WE ARE 26 · FIFA WORLD CUP™ · USA · CANADA · MEXICO</footer>

      {streamModal && (
        <StreamModal
          match={streamModal}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onClose={() => setStreamModal(null)}
          lang={lang}
        />
      )}

      {teamPicker && (
        <TeamPickerModal
          onPick={pickTeam}
          onClose={() => setTeamPicker(null)}
        />
      )}

    </div>
  );
}

// ── DATE HEADER ───────────────────────────────────────────────────────────────
function DateHeader({ date, today, lang }) {
  const d = new Date(date + "T12:00:00");
  const isToday = date === today;
  const options = { weekday:"long", month:"long", day:"numeric" };
  const label = d.toLocaleDateString(lang==="es"?"es-ES":"en-US", options);
  return (
    <div style={S.dateHeader}>
      {isToday && <span style={S.todayBadge}>HOY</span>}
      <span style={{ textTransform:"capitalize", color: isToday?"#FFD700":"#bbb" }}>{label}</span>
    </div>
  );
}

// ── CALENDAR MATCH CARD ───────────────────────────────────────────────────────
function TeamPickerModal({ onPick, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : ALL_COUNTRIES;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#0d1225', borderRadius:'16px 16px 0 0', maxHeight:'75vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid #1e2d4a', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ color:'#FFD700', fontWeight:700, fontSize:14, whiteSpace:'nowrap' }}>🔍 Seleccionar País</span>
          <input autoFocus
            style={{ flex:1, background:'#1a2035', border:'1px solid #2a3a5c', borderRadius:8, padding:'7px 10px', color:'#e0e6f0', fontSize:14, outline:'none' }}
            placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:22, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>✕</button>
        </div>
        <div style={{ overflowY:'auto', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          {filtered.map(c => (
            <button key={c.name} onClick={() => onPick(c.flag, c.name)}
              style={{ background:'#1a2035', border:'1px solid #2a3a5c', borderRadius:8, padding:'8px 10px', color:'#e0e6f0', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
              <span style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>{c.flag}</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarMatchCard({ match, ss, t, groupColor, roundLabel, onEdit, onSave, onChange, onStream, liveStatus, resolvedHome, resolvedAway, onPickHome, onPickAway }) {
  const isLive = liveStatus && liveStatus.phase === 'live';
  const isSoon = liveStatus && liveStatus.phase === 'soon';
  const dispHome = resolvedHome || match.home;
  const dispAway = resolvedAway || match.away;
  const isKO = match.group === 'KO';
  return (
    <div style={{ ...S.calCard, borderLeft:`3px solid ${isLive ? '#E61D25' : groupColor}`, ...(isLive ? { boxShadow:'0 0 12px rgba(230,29,37,0.2)' } : {}) }}>
      <div style={S.calTop}>
        <span style={{ ...S.calBadge, background: groupColor + "33", color: groupColor, border:`1px solid ${groupColor}55` }}>
          {roundLabel}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {isLive && <span style={S.liveMinute}>{liveStatus.label}</span>}
          {isSoon && <span style={{...S.liveMinute,background:"#FF8C00"}}>Pronto</span>}
          <span style={S.calTime}>🕐 {formatLocalTime(match.date, match.time)} &nbsp;📍 {match.venue}</span>
        </div>
      </div>
      <div style={S.calTeams}>
        <div style={S.calTeam}>
          <span style={S.calFlag}>{isKO && resolvedHome ? resolvedHome.split(' ')[0] : match.homeF}</span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={S.calTeamName}>{dispHome}</span>
            {onPickHome && (
              <button onClick={onPickHome} title="Seleccionar país"
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'0 2px', color: resolvedHome ? '#3CAC3B' : '#E61D25', lineHeight:1 }}>
                {resolvedHome ? '✏️' : '🔍'}
              </button>
            )}
          </div>
        </div>
        <div style={S.calScore}>
          {(ss.played || ss.live) && !ss.editing ? (
            <span style={ss.live && !ss.played ? S.scoreLive : S.scoreDisp}>{ss.h} – {ss.a}</span>
          ) : ss.editing ? (
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <input style={S.sInput} type="number" min="0" max="20" value={ss.h}
                onChange={e => onChange("h", e.target.value)} />
              <span style={{color:"#FFD700",fontWeight:900}}>–</span>
              <input style={S.sInput} type="number" min="0" max="20" value={ss.a}
                onChange={e => onChange("a", e.target.value)} />
            </div>
          ) : (
            <span style={{color:"#444",fontSize:13,fontWeight:700}}>{t.vs}</span>
          )}
        </div>
        <div style={{ ...S.calTeam, flexDirection:"row-reverse" }}>
          <span style={S.calFlag}>{isKO && resolvedAway ? resolvedAway.split(' ')[0] : match.awayF}</span>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexDirection:'row-reverse' }}>
            <span style={S.calTeamName}>{dispAway}</span>
            {onPickAway && (
              <button onClick={onPickAway} title="Seleccionar país"
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'0 2px', color: resolvedAway ? '#3CAC3B' : '#E61D25', lineHeight:1 }}>
                {resolvedAway ? '✏️' : '🔍'}
              </button>
            )}
          </div>
        </div>
      </div>
      {isLive && liveStatus.pct > 0 && (
        <div style={S.liveBarBg}>
          <div style={{ ...S.liveBarFill, width:`${Math.min(100, liveStatus.pct * 100)}%` }} />
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:7, flexWrap:"wrap" }}>
        {ss.editing ? (
          <button style={S.btnSave} onClick={() => onSave(ss.h, ss.a)}>{t.saveScore}</button>
        ) : ss.played ? (
          <button style={S.btnEdit} onClick={onEdit}>{t.editScore}</button>
        ) : match.group !== "KO" ? (
          <button style={S.btnEdit} onClick={onEdit}>+ {t.score}</button>
        ) : (
          <span style={{fontSize:11,color:"#444"}}>Pendiente</span>
        )}
        <button style={S.watchBtn} onClick={() => onStream(match)}>📺 Ver</button>
      </div>
    </div>
  );
}

// ── KNOCKOUT BRACKET ──────────────────────────────────────────────────────────
// Map knockout round keys to SCHEDULE round codes
const KO_ROUND_MAP = { r32:"R32", r16:"QF", semi:"SF", final:"FINAL" };

// Pre-compute KO schedule slots by round (stable, module-level)
const KO_BY_ROUND = { R32:[], QF:[], SF:[], FINAL:[] };
SCHEDULE.filter(m => m.group === "KO").forEach(m => { if (KO_BY_ROUND[m.round]) KO_BY_ROUND[m.round].push(m); });
Object.values(KO_BY_ROUND).forEach(arr => arr.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));

function KOMatch({ match, roundKey, i, setKnockout, propagateWinner, t, lang, setTeamPicker }) {
    const [editing, setEditing] = useState(false);
    const [t1, setT1] = useState(match.team1 || "");
    const [t2, setT2] = useState(match.team2 || "");
    const [s1, setS1] = useState(match.score1 ?? "");
    const [s2, setS2] = useState(match.score2 ?? "");

    // Sync local state when the parent knockout state changes
    useEffect(() => {
      setT1(match.team1 || "");
      setT2(match.team2 || "");
      setS1(match.score1 ?? "");
      setS2(match.score2 ?? "");
    }, [match.team1, match.team2, match.score1, match.score2]);

    const schedSlot = KO_BY_ROUND[KO_ROUND_MAP[roundKey]]?.[i];

    function save() {
      if (!t1 || !t2) return;
      const hs = s1 !== "" ? parseInt(s1) : null;
      const as = s2 !== "" ? parseInt(s2) : null;
      const played = hs !== null && as !== null && !isNaN(hs) && !isNaN(as);
      setKnockout(prev => {
        const upd = { ...prev };
        upd[roundKey] = upd[roundKey].map((m, idx) =>
          idx === i ? { ...m, team1:t1, team2:t2, score1:hs, score2:as, played } : m
        );
        return upd;
      });
      if (played && hs !== as) {
        propagateWinner(roundKey, i, hs > as ? t1 : t2);
      }
      setEditing(false);
    }

    const winner = match.played && match.score1 !== null && match.score2 !== null
      ? (match.score1 > match.score2 ? match.team1 : match.score2 > match.score1 ? match.team2 : null)
      : null;

    return (
      <div style={S.koMatch}>
        {schedSlot && (
          <div style={S.koDateChip}>
            📅 {shortDate(schedSlot.date, lang)} · {formatLocalTime(schedSlot.date, schedSlot.time)} · 📍 {schedSlot.venue}
          </div>
        )}
        {editing ? (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0"}}>
              <span style={{flex:1,fontSize:12,color:"#ddd"}}>{t1 || "TBD"}</span>
              <button onClick={() => { setEditing(false); setTeamPicker({ stateKey: roundKey, idx: i, side: 'team1' }); }}
                style={{ background:'#1a2035', border:'1px solid #2A398D', borderRadius:6, color:'#7aadff', fontSize:11, cursor:'pointer', padding:'3px 8px' }}>
                🔍 Cambiar
              </button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
              <input style={S.sInput} type="number" min="0" max="20" value={s1} onChange={e=>setS1(e.target.value)} placeholder="0"/>
              <span style={{color:"#FFD700"}}>–</span>
              <input style={S.sInput} type="number" min="0" max="20" value={s2} onChange={e=>setS2(e.target.value)} placeholder="0"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0"}}>
              <span style={{flex:1,fontSize:12,color:"#ddd"}}>{t2 || "TBD"}</span>
              <button onClick={() => { setEditing(false); setTeamPicker({ stateKey: roundKey, idx: i, side: 'team2' }); }}
                style={{ background:'#1a2035', border:'1px solid #2A398D', borderRadius:6, color:'#7aadff', fontSize:11, cursor:'pointer', padding:'3px 8px' }}>
                🔍 Cambiar
              </button>
            </div>
            <button style={S.btnSave} onClick={save}>{t.saveScore}</button>
            <button style={{...S.btnEdit,fontSize:10,padding:"3px 8px"}} onClick={()=>setEditing(false)}>✕ Cancelar</button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}>
                <span style={{fontSize:12, color: winner===match.team1?"#FFD700":"#ddd", fontWeight: winner===match.team1?900:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {match.team1 || "TBD"}
                </span>
                <button onClick={() => setTeamPicker({ stateKey: roundKey, idx: i, side: 'team1' })}
                  title="Seleccionar país"
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, padding:'0 2px', color: match.team1 ? '#3CAC3B' : '#E61D25', flexShrink:0, lineHeight:1 }}>
                  {match.team1 ? '✏️' : '🔍'}
                </button>
              </div>
              {match.played && match.score1 !== null && (
                <span style={{background:"#2A398D",color:"#FFD700",borderRadius:4,padding:"1px 6px",fontWeight:900,fontSize:13,cursor:"pointer"}} onClick={()=>setEditing(true)}>{match.score1}</span>
              )}
              {!match.played && match.team1 && match.team2 && (
                <button style={{...S.btnEdit,fontSize:10,padding:"2px 6px"}} onClick={()=>setEditing(true)}>+ {t.score}</button>
              )}
            </div>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"2px 0",margin:"2px 0",textAlign:"center",color:"#444",fontSize:10}}>vs</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}>
                <span style={{fontSize:12, color: winner===match.team2?"#FFD700":"#ddd", fontWeight: winner===match.team2?900:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {match.team2 || "TBD"}
                </span>
                <button onClick={() => setTeamPicker({ stateKey: roundKey, idx: i, side: 'team2' })}
                  title="Seleccionar país"
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, padding:'0 2px', color: match.team2 ? '#3CAC3B' : '#E61D25', flexShrink:0, lineHeight:1 }}>
                  {match.team2 ? '✏️' : '🔍'}
                </button>
              </div>
              {match.played && match.score2 !== null && (
                <span style={{background:"#2A398D",color:"#FFD700",borderRadius:4,padding:"1px 6px",fontWeight:900,fontSize:13,cursor:"pointer"}} onClick={()=>setEditing(true)}>{match.score2}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
}

function KOBracket({ knockout, setKnockout, propagateWinner, t, lang, setTeamPicker }) {
  const roundLabels = { r32:t.round32, r16:t.round16, semi:t.semis, final:t.final };
  return (
    <div>
      {["r32","r16","semi","final"].map(rk => (
        <div key={rk} style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:900,color:"#FFD700",textTransform:"uppercase",letterSpacing:2,marginBottom:10,textAlign:"center"}}>{roundLabels[rk]}</div>
          <div style={{display:"grid",gridTemplateColumns:knockout[rk].length>1?"1fr 1fr":"1fr",gap:8}}>
            {knockout[rk].map((match,i)=>(
              <KOMatch key={i} match={match} roundKey={rk} i={i}
                setKnockout={setKnockout} propagateWinner={propagateWinner}
                t={t} lang={lang} setTeamPicker={setTeamPicker} />
            ))}
          </div>
        </div>
      ))}
      {knockout.champion && (
        <div style={{background:"linear-gradient(135deg,#2A398D,#E61D25)",borderRadius:16,padding:20,textAlign:"center",fontSize:20,fontWeight:900,color:"#FFD700",boxShadow:"0 0 40px rgba(255,215,0,0.3)"}}>
          🏆 {t.winner}: <strong>{knockout.champion}</strong>
        </div>
      )}
    </div>
  );
}

// ── STREAM MODAL ─────────────────────────────────────────────────────────────
function StreamModal({ match, apiKey, setApiKey, onClose }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  function saveKey(k) {
    setApiKey(k);
    localStorage.setItem('wc26_ak', k);
  }

  async function searchLinks() {
    if (!apiKey.trim()) {
      setResults(OFFICIAL_LINKS);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `List streaming services where to watch the FIFA World Cup 2026 match: ${match.home} vs ${match.away} on ${match.date} at ${match.time} ET at ${match.venue}.
Return ONLY a JSON array, no explanation. Each item must have: {"name":"string","url":"https://...","official":true/false,"region":"string","subscription":true/false,"note":"string"}.
Include 5-8 options mixing official broadcasters and free streams. Only return the JSON array.`
          }]
        })
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const text = data.content?.[0]?.text?.trim() || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Respuesta inesperada de la IA");
      setResults(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setError(e.message);
      setResults(OFFICIAL_LINKS);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <button style={S.modalClose} onClick={onClose}>✕</button>
        <div style={S.modalTitle}>📺 ¿Dónde ver el partido?</div>
        <div style={S.modalMatch}>
          <span style={{fontSize:22}}>{match.homeF}</span>
          <span style={S.modalMatchName}>{match.home}</span>
          <span style={{color:"#444",margin:"0 8px",fontWeight:900,fontSize:11}}>VS</span>
          <span style={S.modalMatchName}>{match.away}</span>
          <span style={{fontSize:22}}>{match.awayF}</span>
        </div>
        <div style={S.modalMeta}>{match.date} · {formatLocalTime(match.date, match.time)} · 📍 {match.venue}</div>

        <div style={S.disclaimer}>
          <div style={S.disclaimerTitle}>⚠️ Aviso de seguridad — léelo antes de continuar</div>
          <div style={S.disclaimerText}>
            Los enlaces de transmisión, en especial los no oficiales, pueden representar
            riesgos para tu seguridad y privacidad. Antes de acceder a cualquier enlace: (1) prioriza
            siempre los servicios oficiales y licenciados; (2) no introduzcas datos personales
            ni de pago en sitios desconocidos; (3) utiliza un bloqueador de anuncios actualizado;
            (4) verifica que la URL corresponda al sitio legítimo antes de hacer clic. Esta
            aplicación no avala, garantiza ni se responsabiliza de la seguridad, legalidad
            ni disponibilidad de ningún enlace no oficial. Navega con precaución.
          </div>
        </div>

        <div style={S.apiKeyRow}>
          <input
            style={S.apiKeyInput}
            type="password"
            placeholder="API Key de Anthropic (opcional para IA)"
            value={apiKey}
            onChange={e => saveKey(e.target.value)}
          />
          <button style={{ ...S.searchBtn, opacity: loading ? 0.6 : 1 }} onClick={searchLinks} disabled={loading}>
            {loading ? "Buscando…" : "🔍 Buscar"}
          </button>
        </div>
        {!apiKey && <div style={S.apiKeyHint}>Sin API key se muestran los canales oficiales confirmados.</div>}
        {error && <div style={S.streamError}>⚠ {error} — Mostrando canales oficiales.</div>}

        {results ? (
          <div style={S.linkList}>
            {results.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={S.linkItem}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,overflow:"hidden"}}>
                  <span style={{ ...S.officialBadge,
                    background: link.official ? "rgba(60,172,59,0.18)" : "rgba(230,29,37,0.15)",
                    color: link.official ? "#3CAC3B" : "#E61D25",
                    border: `1px solid ${link.official ? "#3CAC3B55" : "#E61D2555"}` }}>
                    {link.official ? "✓ Oficial" : "⚠ No oficial"}
                  </span>
                  <div style={{overflow:"hidden"}}>
                    <div style={S.linkName}>{link.name} <span style={{fontSize:10,color:"#666"}}>({link.region})</span></div>
                    <div style={S.linkNote}>{link.note} · {link.subscription ? "💳 Suscripción" : "🆓 Gratis"}</div>
                  </div>
                </div>
                <span style={S.linkArrow}>→</span>
              </a>
            ))}
          </div>
        ) : !loading && (
          <div style={{textAlign:"center",color:"#555",fontSize:12,padding:"16px 0"}}>
            Presiona "Buscar" para encontrar dónde ver este partido.
          </div>
        )}
      </div>
    </div>
  );
}

// ── LIVE BANNER ───────────────────────────────────────────────────────────────
function LiveBanner({ liveMatches, scheduleScores, onStream }) {
  if (!liveMatches.length) return null;
  return (
    <>
      <style>{ANIM_STYLE}</style>
      <div style={S.liveBanner}>
        <div style={S.liveBannerTitle}>
          <span style={S.liveDot} />
          EN VIVO AHORA
        </div>
        {liveMatches.map(m => {
          const live = getLiveStatus(m);
          if (!live) return null;
          const ss = scheduleScores[m.id];
          return (
            <div key={m.id} style={S.liveCard}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:20}}>{m.homeF}</span>
                  <span style={S.liveTeamName}>{m.home}</span>
                  <div style={S.liveScoreBox}>
                    {(ss?.played || ss?.live)
                      ? <span style={S.liveScore}>{ss.h} – {ss.a}</span>
                      : <span style={{...S.liveScore,color:"#555"}}>– –</span>
                    }
                  </div>
                  <span style={S.liveTeamName}>{m.away}</span>
                  <span style={{fontSize:20}}>{m.awayF}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={S.liveMinute}>{live.label}</span>
                  <span style={{fontSize:10,color:"#555"}}>📍 {m.venue}</span>
                  <button style={S.liveWatchBtn} onClick={() => onStream(m)}>📺 Ver</button>
                </div>
              </div>
              {live.phase === 'live' && live.pct > 0 && (
                <div style={{...S.liveBarBg,marginTop:8}}>
                  <div style={{ ...S.liveBarFill, width:`${Math.min(100, live.pct * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  root:{ minHeight:"100vh", background:"#0a0e1a", color:"#fff", fontFamily:"'Trebuchet MS','Gill Sans',sans-serif", position:"relative", overflowX:"hidden" },
  bgPattern:{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 20% 20%,rgba(42,57,141,0.3) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(230,29,37,0.2) 0%,transparent 50%)", pointerEvents:"none", zIndex:0 },
  notif:{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:"#3CAC3B", color:"#fff", padding:"8px 24px", borderRadius:20, fontWeight:700, zIndex:9999, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" },
  header:{ position:"sticky", top:0, zIndex:100, background:"rgba(10,14,26,0.96)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,215,0,0.12)" },
  hTop:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px" },
  logo:{ display:"flex", alignItems:"center", gap:9 },
  logoIcon:{ fontSize:30, filter:"drop-shadow(0 0 8px rgba(255,215,0,0.6))" },
  logoTitle:{ fontSize:16, fontWeight:900, background:"linear-gradient(90deg,#FFD700,#fff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2 },
  logoSub:{ fontSize:9, color:"#666", letterSpacing:2, textTransform:"uppercase" },
  hCtrls:{ display:"flex", gap:7, alignItems:"center" },
  langBtn:{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.13)", color:"#fff", borderRadius:20, padding:"5px 11px", cursor:"pointer", fontSize:11, fontWeight:700 },
  resetBtn:{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#aaa", borderRadius:20, padding:"5px 9px", cursor:"pointer", fontSize:13 },
  tabs:{ display:"flex", borderTop:"1px solid rgba(255,255,255,0.05)" },
  tab:{ flex:1, padding:"9px 4px", background:"transparent", border:"none", color:"#777", cursor:"pointer", fontSize:10, fontWeight:700, letterSpacing:0.4, transition:"color 0.2s" },
  tabA:{ color:"#FFD700", borderBottom:"2px solid #FFD700" },
  main:{ padding:"12px 12px 80px", maxWidth:600, margin:"0 auto", position:"relative", zIndex:1 },
  // Filter bar
  filterBar:{ display:"flex", flexDirection:"column", gap:8, marginBottom:14, background:"rgba(255,255,255,0.03)", borderRadius:12, padding:10, border:"1px solid rgba(255,255,255,0.07)" },
  filterRow:{ display:"flex", gap:6, flexWrap:"wrap" },
  filterBtn:{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#999", borderRadius:16, padding:"4px 12px", cursor:"pointer", fontSize:11, fontWeight:700 },
  filterBtnA:{ background:"rgba(255,215,0,0.15)", border:"1px solid #FFD700", color:"#FFD700" },
  // Date header
  dateHeader:{ display:"flex", alignItems:"center", gap:8, padding:"12px 4px 6px", fontSize:13, fontWeight:700 },
  todayBadge:{ background:"#E61D25", color:"#fff", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:900 },
  // Calendar card
  calCard:{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 12px", marginBottom:8 },
  calTop:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:4 },
  calBadge:{ borderRadius:12, padding:"2px 9px", fontSize:10, fontWeight:900 },
  calTime:{ fontSize:10, color:"#666" },
  calTeams:{ display:"flex", alignItems:"center", gap:6 },
  calTeam:{ flex:1, display:"flex", alignItems:"center", gap:5 },
  calFlag:{ fontSize:20, flexShrink:0 },
  calTeamName:{ fontSize:11, color:"#ccc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 },
  calScore:{ minWidth:72, textAlign:"center", flexShrink:0 },
  // Shared
  scoreDisp:{ background:"rgba(255,215,0,0.1)", border:"1px solid rgba(255,215,0,0.3)", borderRadius:7, padding:"3px 9px", fontSize:14, fontWeight:900, color:"#FFD700", display:"block" },
  scoreLive:{ background:"rgba(230,29,37,0.15)", border:"1px solid rgba(230,29,37,0.5)", borderRadius:7, padding:"3px 9px", fontSize:14, fontWeight:900, color:"#E61D25", display:"block", animation:"livePulse 2s ease-in-out infinite" },
  sInput:{ width:36, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,215,0,0.4)", color:"#FFD700", borderRadius:6, padding:"4px 5px", textAlign:"center", fontSize:14, fontWeight:700 },
  btnEdit:{ background:"rgba(42,57,141,0.4)", border:"1px solid rgba(42,57,141,0.6)", color:"#8ca0ff", borderRadius:12, padding:"4px 13px", cursor:"pointer", fontSize:11, fontWeight:700 },
  btnSave:{ background:"#3CAC3B", border:"none", color:"#fff", borderRadius:12, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:700 },
  // Groups
  groupSel:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12, justifyContent:"center" },
  gTab:{ width:34, height:34, borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"#aaa", cursor:"pointer", fontWeight:900, fontSize:12 },
  card:{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" },
  cardH:{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" },
  cardTitle:{ fontSize:12, fontWeight:700, color:"#ddd" },
  badge:{ color:"#FFD700", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:900 },
  table:{ width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:{ padding:"7px 5px", color:"#555", fontWeight:700, textAlign:"center", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:10, whiteSpace:"nowrap" },
  td:{ padding:"8px 5px", textAlign:"center", fontSize:11 },
  // KO
  koMatch:{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:10 },
  koInput:{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:6, padding:"5px 8px", fontSize:12, width:"100%", boxSizing:"border-box" },
  koDateChip:{ fontSize:10, color:"#5a6a8a", marginBottom:7, paddingBottom:5, borderBottom:"1px solid rgba(255,255,255,0.05)", letterSpacing:0.2 },
  // Group match date chip
  matchDateChip:{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#5a6a8a", marginBottom:6, flexWrap:"wrap" },
  matchDateDot:{ width:5, height:5, borderRadius:"50%", background:"#2A398D", display:"inline-block", flexShrink:0 },
  // Stats
  statsGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 },
  statCard:{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:14, textAlign:"center" },
  empty:{ textAlign:"center", color:"#555", padding:40, fontSize:14 },
  footer:{ textAlign:"center", padding:"14px", fontSize:9, color:"#2a2a2a", letterSpacing:2, borderTop:"1px solid rgba(255,255,255,0.03)", background:"rgba(0,0,0,0.3)" },
  // Live banner
  liveBanner:{ background:"rgba(230,29,37,0.07)", border:"1px solid rgba(230,29,37,0.3)", borderRadius:14, padding:"12px 12px 8px", marginBottom:14 },
  liveBannerTitle:{ display:"flex", alignItems:"center", gap:8, fontSize:10, fontWeight:900, color:"#E61D25", letterSpacing:3, textTransform:"uppercase", marginBottom:10 },
  liveDot:{ width:8, height:8, borderRadius:"50%", background:"#E61D25", display:"inline-block", animation:"livePulse 1.2s ease-in-out infinite", flexShrink:0 },
  liveCard:{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"9px 10px", marginBottom:7 },
  liveTeamName:{ fontSize:11, color:"#ccc", maxWidth:72, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  liveScoreBox:{ minWidth:50, textAlign:"center" },
  liveScore:{ fontWeight:900, fontSize:17, color:"#FFD700" },
  liveMinute:{ background:"#E61D25", color:"#fff", borderRadius:6, padding:"2px 7px", fontSize:11, fontWeight:900, flexShrink:0 },
  liveWatchBtn:{ background:"rgba(42,57,141,0.5)", border:"1px solid #2A398D55", color:"#8ca0ff", borderRadius:8, padding:"3px 9px", cursor:"pointer", fontSize:10, fontWeight:700 },
  liveBarBg:{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2 },
  liveBarFill:{ height:"100%", background:"linear-gradient(90deg,#E61D25,#FFD700)", borderRadius:2, transition:"width 30s linear" },
  // Stream modal
  modalOverlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:9000, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 10px 10px" },
  modalBox:{ background:"#0d1220", border:"1px solid rgba(255,215,0,0.18)", borderRadius:"20px 20px 16px 16px", padding:"20px 16px 16px", width:"100%", maxWidth:600, maxHeight:"92vh", overflowY:"auto", position:"relative" },
  modalClose:{ position:"absolute", top:12, right:14, background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:22, lineHeight:1 },
  modalTitle:{ fontSize:15, fontWeight:900, color:"#FFD700", textAlign:"center", marginBottom:10 },
  modalMatch:{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:5 },
  modalMatchName:{ fontSize:13, fontWeight:700, color:"#ddd" },
  modalMeta:{ fontSize:11, color:"#666", textAlign:"center", marginBottom:12 },
  disclaimer:{ background:"rgba(255,140,0,0.08)", border:"1px solid rgba(255,140,0,0.3)", borderRadius:10, padding:"10px 12px", marginBottom:12 },
  disclaimerTitle:{ fontSize:12, fontWeight:900, color:"#FF8C00", marginBottom:6 },
  disclaimerText:{ fontSize:11, color:"#bbb", lineHeight:1.65 },
  apiKeyRow:{ display:"flex", gap:8, marginBottom:5 },
  apiKeyInput:{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.13)", color:"#fff", borderRadius:8, padding:"7px 10px", fontSize:12 },
  searchBtn:{ background:"#2A398D", border:"none", color:"#fff", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:700, whiteSpace:"nowrap" },
  apiKeyHint:{ fontSize:10, color:"#555", marginBottom:8, textAlign:"center" },
  streamError:{ fontSize:11, color:"#E61D25", marginBottom:8, textAlign:"center", padding:"4px 0" },
  linkList:{ display:"flex", flexDirection:"column", gap:7, marginTop:10 },
  linkItem:{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"9px 12px", textDecoration:"none", color:"inherit" },
  officialBadge:{ borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:900, whiteSpace:"nowrap", flexShrink:0 },
  linkName:{ fontSize:13, fontWeight:700, color:"#eee" },
  linkNote:{ fontSize:10, color:"#777", marginTop:2 },
  linkArrow:{ color:"#444", fontSize:16, flexShrink:0, marginLeft:6 },
  watchBtn:{ background:"rgba(42,57,141,0.25)", border:"1px solid rgba(42,57,141,0.5)", color:"#8ca0ff", borderRadius:12, padding:"4px 12px", cursor:"pointer", fontSize:11, fontWeight:700 },
};
