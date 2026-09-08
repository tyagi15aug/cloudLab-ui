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

export function getReadiness(): Promise<ReadinessResponse> {
  return apiClient.get<ReadinessResponse>("/api/health");
}
