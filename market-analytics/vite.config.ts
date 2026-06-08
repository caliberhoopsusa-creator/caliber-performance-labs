import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, proxy API calls to the Express server so the SPA and API share
// an origin (no CORS, cookies/streaming just work).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
