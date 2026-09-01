/**
 * Proxy hacia la API de Anthropic.
 *
 * El navegador NO puede llamar a api.anthropic.com directamente: el preflight
 * CORS falla y, aunque pasara, habría que embarcar la clave en el bundle (donde
 * cualquiera puede leerla). Este handler se interpone: guarda la clave del lado
 * del servidor y reenvía la petición tal cual, incluido el streaming.
 *
 * Se usa como middleware de Vite en dev/preview y sirve igual como función
 * serverless (Vercel/Netlify) o dentro de un Express.
 *
 * Sin ANTHROPIC_API_KEY definida entra en MODO DEMO: responde con datos de
 * ejemplo en el mismo formato SSE que la API real, para que la interfaz se
 * pueda ver y probar. Los datos de demo van marcados con `_demo: true`.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/* ── Datos de demostración ────────────────────────────────────────────────
   Modelos reales del mercado colombiano con precios de referencia 2024-2025.
   Algunos van sin imageUrl a propósito, para ejercitar la cascada de imágenes. */
const DEMO = [
  {
    brand: "Chevrolet", model: "Tracker", version: "Premier Turbo", year: 2024,
    category: "SUV", condition: "Nuevo", price: 119900000, currency: "COP",
    priceFormatted: "$119.900.000",
    description: "SUV compacto con motor turbo 1.2L, pantalla táctil de 8 pulgadas y control de crucero.",
    keySpecs: { engine: "1.2 Turbo 133 HP", transmission: "CVT (Variador Continuo)", fuelType: "Gasolina", seats: 5, power: "133 HP", traction: "FWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.chevrolet.com.co", source: "chevrolet.com.co",
  },
  {
    brand: "Renault", model: "Duster", version: "Intens 4x2", year: 2024,
    category: "SUV", condition: "Nuevo", price: 104900000, currency: "COP",
    priceFormatted: "$104.900.000",
    description: "SUV robusta con buena altura al piso, ideal para carretera colombiana.",
    keySpecs: { engine: "1.6 16V 115 HP", transmission: "Mecánica", fuelType: "Gasolina", seats: 5, power: "115 HP", traction: "4x2", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.renault.com.co", source: "renault.com.co",
  },
  {
    brand: "Kia", model: "Sportage", version: "LX 2.0", year: 2025,
    category: "SUV", condition: "Nuevo", price: 149900000, currency: "COP",
    priceFormatted: "$149.900.000",
    description: "SUV mediana con diseño renovado, amplio baúl y garantía de 5 años.",
    keySpecs: { engine: "2.0 MPI 155 HP", transmission: "Automática", fuelType: "Gasolina", seats: 5, power: "155 HP", traction: "FWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.kia.com.co", source: "kia.com.co",
  },
  {
    brand: "Hyundai", model: "Creta", version: "Premium", year: 2024,
    category: "SUV", condition: "Nuevo", price: 132900000, currency: "COP",
    priceFormatted: "$132.900.000",
    description: "SUV urbana con equipamiento completo y buen consumo en ciudad.",
    keySpecs: { engine: "1.5 MPI 115 HP", transmission: "Automática", fuelType: "Gasolina", seats: 5, power: "115 HP", traction: "FWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.hyundai.com.co", source: "hyundai.com.co",
  },
  {
    brand: "Toyota", model: "Corolla", version: "SE-G Hybrid", year: 2025,
    category: "Sedán", condition: "Nuevo", price: 159900000, currency: "COP",
    priceFormatted: "$159.900.000",
    description: "Sedán híbrido de bajo consumo, referencia en confiabilidad.",
    keySpecs: { engine: "1.8 Hybrid 122 HP", transmission: "CVT (Variador Continuo)", fuelType: "Híbrido", seats: 5, power: "122 HP", traction: "FWD", doors: 4 },
    imageUrl: "", dealerUrl: "https://www.toyota.com.co", source: "toyota.com.co",
  },
  {
    brand: "Mazda", model: "CX-5", version: "Grand Touring", year: 2024,
    category: "SUV", condition: "Nuevo", price: 189900000, currency: "COP",
    priceFormatted: "$189.900.000",
    description: "SUV premium con acabados de gama alta y excelente manejo.",
    keySpecs: { engine: "2.5 SkyActiv 187 HP", transmission: "Automática", fuelType: "Gasolina", seats: 5, power: "187 HP", traction: "AWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.mazda.com.co", source: "mazda.com.co",
  },
  {
    brand: "Chevrolet", model: "Onix", version: "LTZ Turbo", year: 2024,
    category: "Sedán", condition: "Nuevo", price: 82900000, currency: "COP",
    priceFormatted: "$82.900.000",
    description: "Sedán compacto turbo, de los más vendidos del país.",
    keySpecs: { engine: "1.0 Turbo 116 HP", transmission: "Automática", fuelType: "Gasolina", seats: 5, power: "116 HP", traction: "FWD", doors: 4 },
    imageUrl: "", dealerUrl: "https://www.chevrolet.com.co", source: "chevrolet.com.co",
  },
  {
    brand: "Renault", model: "Sandero", version: "Life", year: 2024,
    category: "Hatchback", condition: "Nuevo", price: 62900000, currency: "COP",
    priceFormatted: "$62.900.000",
    description: "Hatchback económico, bajo costo de mantenimiento y repuestos.",
    keySpecs: { engine: "1.6 16V 85 HP", transmission: "Mecánica", fuelType: "Gasolina", seats: 5, power: "85 HP", traction: "FWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.renault.com.co", source: "renault.com.co",
  },
  {
    brand: "Suzuki", model: "Jimny", version: "GLX 4x4", year: 2024,
    category: "SUV", condition: "Nuevo", price: 124900000, currency: "COP",
    priceFormatted: "$124.900.000",
    description: "Todoterreno compacto con tracción 4x4 real y caja reductora.",
    keySpecs: { engine: "1.5 VVT 102 HP", transmission: "Mecánica", fuelType: "Gasolina", seats: 4, power: "102 HP", traction: "4x4", doors: 3 },
    imageUrl: "", dealerUrl: "https://www.suzuki.com.co", source: "suzuki.com.co",
  },
  {
    brand: "BYD", model: "Dolphin", version: "Mini GL", year: 2025,
    category: "Eléctrico", condition: "Nuevo", price: 109900000, currency: "COP",
    priceFormatted: "$109.900.000",
    description: "Eléctrico urbano con autonomía de 300 km y carga rápida.",
    keySpecs: { engine: "Eléctrico 95 HP", transmission: "Automática", fuelType: "Eléctrico", seats: 5, power: "95 HP", traction: "FWD", doors: 5 },
    imageUrl: "", dealerUrl: "https://www.byd.com.co", source: "byd.com.co",
  },
];

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      return;
    }
    let datos = "";
    req.on("data", (c) => {
      datos += c;
      if (datos.length > 2_000_000) reject(new Error("cuerpo demasiado grande"));
    });
    req.on("end", () => resolve(datos));
    req.on("error", reject);
  });
}

const sse = (obj) => `event: ${obj.type}\ndata: ${JSON.stringify(obj)}\n\n`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Filtra el catálogo de demo según lo que pidió el prompt del cliente. */
function filtrarDemo(prompt = "") {
  const leer = (etiqueta) => {
    const m = prompt.match(new RegExp(`^${etiqueta}:\\s*(.+)$`, "mi"));
    return m ? m[1].trim() : "";
  };
  const marca = leer("Marca");
  const categoria = leer("Categoría");
  const condicion = leer("Condición");
  const transmision = leer("Transmisión");

  const coincide = (valor, filtro) =>
    !filtro || /^(todas|todos)$/i.test(filtro) ||
    String(valor).toLowerCase().includes(filtro.toLowerCase());

  let lista = DEMO.filter(
    (v) =>
      coincide(v.brand, marca) &&
      coincide(v.category, categoria) &&
      coincide(v.condition, condicion) &&
      coincide(v.keySpecs.transmission, transmision)
  );
  // Si el filtro deja todo fuera, es más útil mostrar el catálogo completo
  // que una lista vacía en una demo.
  if (lista.length === 0) lista = DEMO;
  return lista;
}

/** Responde en el mismo formato SSE que la API real, en modo demo. */
async function responderDemo(res, cuerpo) {
  const esBusquedaWeb = Array.isArray(cuerpo?.tools) && cuerpo.tools.length > 0;

  // La verificación de precios en segundo plano no es streaming.
  if (esBusquedaWeb || cuerpo?.stream !== true) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-AutoFinder-Demo", "1");
    res.end(JSON.stringify({
      id: "msg_demo", type: "message", role: "assistant",
      content: [{ type: "text", text: '{"updates":[]}' }],
      model: cuerpo?.model ?? "demo", stop_reason: "end_turn",
    }));
    return;
  }

  const prompt = cuerpo?.messages?.[0]?.content ?? "";
  const lista = filtrarDemo(String(prompt));

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-AutoFinder-Demo", "1");
  res.flushHeaders?.();

  res.write(sse({ type: "message_start", message: { id: "msg_demo", role: "assistant", content: [] } }));
  res.write(sse({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }));

  let cancelado = false;
  res.on("close", () => { cancelado = true; });

  for (const v of lista) {
    if (cancelado) return;
    await dormir(450); // simula el ritmo real del streaming
    const linea = JSON.stringify({ ...v, _demo: true }) + "\n";
    res.write(sse({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: linea } }));
  }

  res.write(sse({ type: "content_block_stop", index: 0 }));
  res.write(sse({ type: "message_stop" }));
  res.end();
}

/**
 * @param {object} [opciones]
 * @param {string} [opciones.apiKey] Clave explícita. En dev la inyecta
 *   vite.config.js con loadEnv(), porque Vite NO vuelca el .env en
 *   process.env: solo expone al cliente las variables con prefijo VITE_.
 *   En producción serverless se omite y se lee de process.env.
 */
export function createProxyHandler(opciones = {}) {
  // Se resuelve en cada petición para que el host pueda inyectar la variable
  // en caliente sin reiniciar el proceso.
  const obtenerClave = () => opciones.apiKey || process.env.ANTHROPIC_API_KEY || "";

  return async function handler(req, res) {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.end();
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: { message: "Usa POST" } }));
      return;
    }

    let cuerpoTexto;
    try {
      cuerpoTexto = await leerCuerpo(req);
    } catch (e) {
      res.statusCode = 413;
      res.end(JSON.stringify({ error: { message: e.message } }));
      return;
    }

    let cuerpo;
    try {
      cuerpo = JSON.parse(cuerpoTexto || "{}");
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: { message: "JSON inválido" } }));
      return;
    }

    const clave = obtenerClave();
    if (!clave) {
      await responderDemo(res, cuerpo);
      return;
    }

    try {
      const upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": clave,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: cuerpoTexto,
      });

      res.statusCode = upstream.status;
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") ?? "application/json"
      );
      if (upstream.body && upstream.headers.get("content-type")?.includes("event-stream")) {
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.flushHeaders?.();
        const reader = upstream.body.getReader();
        let cancelado = false;
        res.on("close", () => { cancelado = true; reader.cancel().catch(() => {}); });
        while (!cancelado) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else {
        res.end(Buffer.from(await upstream.arrayBuffer()));
      }
    } catch (err) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: { message: "No se pudo contactar la API de Anthropic: " + err.message },
      }));
    }
  };
}

/**
 * Plugin de Vite: monta el proxy en /api/messages durante dev y preview.
 * @param {object} [opciones]
 * @param {string} [opciones.ruta]
 * @param {string} [opciones.apiKey] La pasa vite.config.js desde loadEnv().
 */
export function anthropicProxyPlugin(opciones = {}) {
  const ruta = opciones.ruta ?? "/api/messages";
  const handler = createProxyHandler({ apiKey: opciones.apiKey });
  const montar = (server) => {
    server.middlewares.use(ruta, (req, res, next) => {
      handler(req, res).catch(next);
    });
  };
  return {
    name: "autofinder-anthropic-proxy",
    configResolved() {
      const modo = (opciones.apiKey || process.env.ANTHROPIC_API_KEY)
        ? "clave detectada — consultas reales"
        : "sin ANTHROPIC_API_KEY — MODO DEMOSTRACIÓN";
      console.log(`  \x1b[36m➜\x1b[0m  AutoFinder API:  ${modo}`);
    },
    configureServer: montar,
    configurePreviewServer: montar,
  };
}

export default createProxyHandler();
