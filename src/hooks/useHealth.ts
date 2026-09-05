import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface HealthResponse {
  status: string;
  provider: string;
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiClient.get<HealthResponse>("/health"),
    // The API itself already retries LocalStack connectivity a few times
    // on startup (see the backend's app/main.py); this just keeps the
    // status pill honest afterward without hammering the endpoint.
    refetchInterval: 30_000,
    retry: 1,
  });
}
