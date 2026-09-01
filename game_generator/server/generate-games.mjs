// Lógica de generación de juegos con Claude.
// Se usa desde:
//   - netlify/functions/generate.mjs  (producción, Netlify Functions)
//   - vite.config.js                  (desarrollo, middleware de `npm run dev`)
// La API key NUNCA se envía al navegador: solo se usa aquí, en el servidor.

import Anthropic from "@anthropic-ai/sdk";

// Modelo de Claude. `claude-opus-5` da la mejor calidad.
// Si en Netlify (plan free: límite de 10 s por función) las peticiones dan
// timeout, cambia a "claude-haiku-4-5" — es bastante más rápido y económico.
const MODEL = "claude-opus-5";

const CATEGORIAS = {
  campamento: {
    label: "Campamento",
    desc: "actividades al aire libre, naturaleza y convivencia",
  },
  reunion: {
    label: "Reunión",
    desc: "dinámicas de integración para grupos en espacios cerrados",
  },
  capacitacion: {
    label: "Capacitación",
    desc: "juegos de aprendizaje, reflexión y trabajo en equipo",
  },
};

function clampInt(value, min, max, fallback) {
  const n = parseInt(String(value ?? "").trim(), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Extrae de forma tolerante el objeto JSON { juegos: [...] } de la respuesta
 * del modelo y normaliza cada juego a la forma que espera la UI.
 */
export function parseGames(text) {
  if (!text) return [];

  let raw = String(text)
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) raw = raw.slice(first, last + 1);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const list = Array.isArray(parsed) ? parsed : parsed?.juegos;
  if (!Array.isArray(list)) return [];

  return list
    .map((g) => ({
      nombre: String(g?.nombre ?? "").trim() || "Juego",
      duracion: String(g?.duracion ?? "").trim(),
      explicacion: String(g?.explicacion ?? "").trim(),
      materiales: Array.isArray(g?.materiales)
        ? g.materiales.map((m) => String(m).trim()).filter(Boolean)
        : [],
    }))
    .filter((g) => g.explicacion.length > 0);
}

/**
 * @param {object} opts
 * @param {string|number} opts.tiempo     Minutos totales disponibles
 * @param {string|number} opts.cantidad   Nº de juegos a generar
 * @param {string}        opts.tipo       Público (p. ej. "niños", "jóvenes")
 * @param {string}        opts.categoria  "campamento" | "reunion" | "capacitacion"
 * @param {string}        opts.apiKey     API key de Anthropic (solo servidor)
 * @returns {Promise<{ juegos: Array }>}
 */
export async function generateGames({ tiempo, cantidad, tipo, categoria, apiKey } = {}) {
  if (!apiKey) {
    const err = new Error("Falta la API key de Anthropic.");
    err.status = 500;
    throw err;
  }

  const mins = clampInt(tiempo, 5, 240, 30);
  const count = clampInt(cantidad, 1, 15, 5);
  const audience = (String(tipo ?? "").trim() || "niños").slice(0, 60);
  const cat = CATEGORIAS[categoria] || CATEGORIAS.campamento;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "low" },
    system:
      "Eres un asistente experto en recreación con propósito para la CCI (Comunidad Cristiana " +
      "Internacional) en América Latina. Diseñas juegos grupales seguros, inclusivos, sencillos " +
      "de explicar y con propósito de comunidad y fe. Respondes SIEMPRE y ÚNICAMENTE con un " +
      "objeto JSON válido: sin markdown, sin comentarios y sin ningún texto fuera del JSON.",
    messages: [
      {
        role: "user",
        content:
          `Genera exactamente ${count} juegos grupales para "${audience}" que en conjunto duren ` +
          `aproximadamente ${mins} minutos. Reparte el tiempo entre los juegos de forma realista ` +
          `(la suma de las duraciones debe acercarse a ${mins} minutos).\n` +
          `Contexto: ${cat.label} — los juegos deben ser apropiados para ${cat.desc}.\n\n` +
          `Devuelve un JSON con esta forma EXACTA:\n` +
          `{\n` +
          `  "juegos": [\n` +
          `    {\n` +
          `      "nombre": "string",\n` +
          `      "duracion": "X min",\n` +
          `      "explicacion": "2-3 oraciones claras de cómo se juega",\n` +
          `      "materiales": ["string"]\n` +
          `    }\n` +
          `  ]\n` +
          `}\n` +
          `Si un juego no necesita materiales, usa []. No incluyas nada fuera del JSON.`,
      },
    ],
  });

  const text = (response.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return { juegos: parseGames(text) };
}
