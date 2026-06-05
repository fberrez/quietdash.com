import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev: proxy API to the Hono server. Prod: the server serves dist/ directly.
    proxy: { "/api": "http://localhost:3000" },
  },
  build: { outDir: "dist" },
});
