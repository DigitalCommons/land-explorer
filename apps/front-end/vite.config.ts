import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Dev server only: proxy /api and the websocket - DEV_API_PROXY is set
// by docker-compose.dev.yml for hot reloading
const devApiProxy = process.env.DEV_API_PROXY ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      // Force CJS build to avoid ESM import mutation issues
      {
        find: /^react-mapbox-gl$/,
        replacement: "react-mapbox-gl/lib/index.js",
      },
      // Polyfill Node.js `events` module for browser (required by mapbox-gl-geocoder)
      {
        find: "events",
        replacement: "events/events.js",
      },
    ],
  },
  server: {
    port: 8080,
    proxy: {
      "/api": devApiProxy,
      "/socket.io": { target: devApiProxy, ws: true },
    },
  },
  build: {
    outDir: "dist",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ["mapbox-gl", "react-mapbox-gl"],
  },
});
