import { apiClient } from "./client";

// Distinct from useHealth.ts's `/health` (strict, used for the in-app
// status pill) — this hits the aggregate `/api/health` endpoint built for
// the cold-start launch screen (Master Plan §3.2 / CloudLab Implementation
// Plan §8.5). It always resolves to a 200 with a status per dependency
// rather than throwing, so "still starting" and "actually broken" don't
// look the same to a caller.
export type DependencyStatus = "ready" | "starting";

export interface ReadinessResponse {
  api: DependencyStatus;
  localstack: DependencyStatus;
  overall: DependencyStatus;
}

// Emulator's own public URL (Render), so this page can ping it directly.
// Unset in local dev -- docker-compose's emulator is never hibernated, so
// there's nothing to wake.
const LOCALSTACK_WAKE_URL = import.meta.env.VITE_LOCALSTACK_URL;

// Observed live: cloudlab-api's own server-to-server boto3 calls did NOT
// reliably wake the emulator from Render's free-tier hibernation -- polling
// sat on timeouts/502s for 9+ minutes straight -- but a direct browser
// request to the emulator's URL woke it within seconds. So the launch
// screen pings it directly too, in parallel with the real readiness check
// below, rather than relying solely on the API's outbound calls to do the
// waking. `mode: "no-cors"` because the emulator doesn't send CORS headers
// for this and we don't need to read the response -- we already get the
// authoritative answer from /api/health above; this is purely a wake nudge,
// so a failure here is silently ignored rather than surfaced as an error.
function nudgeLocalstackAwake(): void {
  if (!LOCALSTACK_WAKE_URL) return;
  fetch(`${LOCALSTACK_WAKE_URL}/_localstack/health`, { mode: "no-cors" }).catch(() => {
    // Ignored -- fire-and-forget, not a dependency of the real check.
  });
}

export function getReadiness(): Promise<ReadinessResponse> {
  nudgeLocalstackAwake();
  return apiClient.get<ReadinessResponse>("/api/health");
}
