/**
 * Confirms the real backend API is reachable before Playwright spends time
 * launching browsers and starting the dev server, and fails with a clear,
 * actionable message instead of 30 confusing "connection refused" test
 * failures if it isn't.
 *
 * These E2E tests deliberately do NOT mock the network (that's what the
 * Vitest/MSW unit tests are for) — they exercise the real fetch -> Vite
 * proxy -> FastAPI -> provider -> LocalStack path end to end, so a real API
 * has to be running first. See README.md's E2E section for how to start
 * one.
 */
const API_URL = process.env.E2E_API_URL || "http://localhost:8000";

export default async function globalSetup(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) {
      throw new Error(`Backend responded with HTTP ${response.status}`);
    }
  } catch (cause) {
    throw new Error(
      `\n\nE2E tests need a running backend API at ${API_URL}, and it isn't reachable.\n` +
        "Start it first:\n" +
        "  cd ../cloudlab-api && ./scripts/dev-up.sh   (docker compose)\n" +
        "or point E2E_API_URL at wherever it's already running.\n",
      { cause },
    );
  }
}
