import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/sitemap.xml": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // three.js (hero GridDistortion) is a lazy chunk loaded after first paint on desktop only.
    chunkSizeWarningLimit: 800,
  },
});
