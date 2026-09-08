import { useQuery } from "@tanstack/react-query";
import { getReadiness } from "../api/readiness";

export function useReadiness() {
  return useQuery({
    queryKey: ["readiness"],
    queryFn: getReadiness,
    // Keep polling every 2s (per Implementation Plan §8.5) until ready,
    // then stop — no point still hitting this once the app is up.
    refetchInterval: (query) => (query.state.data?.overall === "ready" ? false : 2_000),
    // The very first calls during a real cold start can fail outright
    // (connection refused before the container has bound its port) before
    // they ever reach the point of returning a "starting" body — that's
    // not a real error, it's the earliest phase of the same cold start.
    // Keep retrying indefinitely rather than surfacing a query error.
    retry: true,
    retryDelay: 2_000,
    // A stale readiness result must never flash "ready" from cache — this
    // check has to reflect what's true right now.
    staleTime: 0,
    gcTime: 0,
  });
}
