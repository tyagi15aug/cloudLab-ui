import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 2.3 E2E config.
 *
 * These tests exercise the real app shell, routing, and UI states against
 * a running API — see tests/e2e/README.md for how "running API" is
 * satisfied in this sandbox (moto server standing in for LocalStack, same
 * substitution used by the backend's integration tests) versus a normal
 * machine (`docker compose up` + `npm run dev`, the real thing).
 *
 * `webServer` starts the Vite dev server itself so `npx playwright test`
 * is a single, reproducible command — it does NOT start the backend, which
 * must already be running (see globalSetup's guard in tests/e2e/global-setup.ts).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
