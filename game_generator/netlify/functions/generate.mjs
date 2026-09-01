// Netlify Function (v2) — proxy servidor para la API de Anthropic.
// El navegador llama a POST /api/generate (ver redirect en netlify.toml);
// la API key vive solo aquí, en la variable de entorno de Netlify.

import { generateGames } from "../../server/generate-games.mjs";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "El servidor no tiene configurada ANTHROPIC_API_KEY. Añádela en " +
          "Netlify → Site settings → Environment variables y vuelve a desplegar.",
      },
      500,
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "El cuerpo de la petición no es JSON válido." }, 400);
  }

  try {
    const { tiempo, cantidad, tipo, categoria } = body || {};
    const result = await generateGames({ tiempo, cantidad, tipo, categoria, apiKey });

    if (!result.juegos.length) {
      return json(
        { error: "El modelo no devolvió juegos válidos. Intenta de nuevo o ajusta los parámetros." },
        502,
      );
    }
    return json(result);
  } catch (err) {
    console.error("[api/generate]", err);
    const status = Number.isInteger(err?.status) ? err.status : 502;
    const message =
      status === 401
        ? "La API key de Anthropic no es válida."
        : status === 429
          ? "Se alcanzó el límite de solicitudes de la API. Intenta de nuevo en un momento."
          : "No se pudieron generar los juegos. Intenta de nuevo.";
    return json({ error: message }, status);
  }
};
