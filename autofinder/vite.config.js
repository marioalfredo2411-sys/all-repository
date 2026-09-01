import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { anthropicProxyPlugin } from "./server/anthropic-proxy.mjs";

export default defineConfig(({ mode }) => {
  // Tercer argumento "": carga TODAS las variables del .env, no solo las
  // VITE_*. Vite no vuelca el .env en process.env, así que la clave hay que
  // leerla aquí y pasársela al proxy explícitamente.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      anthropicProxyPlugin({
        ruta: "/api/messages",
        apiKey: env.ANTHROPIC_API_KEY,
      }),
    ],
    // Rutas absolutas: sirven igual en la web (dominio raíz) y en Capacitor,
    // que sirve la app desde https://localhost (Android) y capacitor://localhost (iOS).
    base: "/",
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: "dist",
      target: "es2020",
      sourcemap: false,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
          },
        },
      },
    },
  };
});
