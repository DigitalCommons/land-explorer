import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

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
