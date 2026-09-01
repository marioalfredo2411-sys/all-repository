import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Middleware para desarrollo: emula la Netlify Function en `npm run dev` y
// `npm run preview`. POST /api/generate -> server/generate-games.mjs
// (usa ANTHROPIC_API_KEY de .env.local). En producción lo hace la Netlify Function.
function devApiPlugin(env) {
  const handle = (req, res, next) => {
    if (req.method !== 'POST') return next();

    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', async () => {
      const send = (status, obj) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
      };

      const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return send(500, {
          error: 'Falta ANTHROPIC_API_KEY en game_generator/.env.local (reinicia el servidor tras añadirla).',
        });
      }

      try {
        const body = raw ? JSON.parse(raw) : {};
        const { generateGames } = await import('./server/generate-games.mjs');
        const result = await generateGames({ ...body, apiKey });
        if (!result.juegos.length) {
          return send(502, { error: 'El modelo no devolvió juegos válidos. Intenta de nuevo.' });
        }
        return send(200, result);
      } catch (err) {
        console.error('[api/generate]', err?.stack || err);
        const status = Number.isInteger(err?.status) ? err.status : 502;
        return send(status, {
          error:
            status === 401
              ? 'La API key de Anthropic no es válida.'
              : 'No se pudieron generar los juegos (revisa la consola del servidor).',
        });
      }
    });
  };

  return {
    name: 'dev-api-generate',
    // Solo aporta middlewares de servidor (dev + preview); inerte en `build`.
    configureServer(server) {
      server.middlewares.use('/api/generate', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/generate', handle);
    },
  };
}

export default defineConfig(({ mode }) => {
  // '' como prefijo = carga TODAS las variables de .env* (incluida ANTHROPIC_API_KEY).
  // Esto NO las expone al cliente: al navegador solo llegan las que empiezan por VITE_.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), devApiPlugin(env)],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});
