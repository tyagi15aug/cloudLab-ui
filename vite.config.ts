/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Avoids needing CORS during local dev: /api and /health calls from
      // the Vite dev server are forwarded to the FastAPI backend.
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // tests/e2e/** are Playwright specs (npm run test:e2e), not Vitest —
    // they use @playwright/test's own test()/expect() and must not be
    // collected here.
    exclude: ["**/node_modules/**", "tests/e2e/**"],
  },
});
