import { apiClient } from "./client";
import type { OperationList, OperationMetrics, OperationResource } from "./types";

const BASE = "/api/dev/operations";

export function listOperations(limit = 50): Promise<OperationList> {
  return apiClient.get<OperationList>(`${BASE}?limit=${limit}`);
}

export function getOperationMetrics(): Promise<OperationMetrics> {
  return apiClient.get<OperationMetrics>(`${BASE}/metrics`);
}

export function getOperation(id: number): Promise<OperationResource> {
  return apiClient.get<OperationResource>(`${BASE}/${id}`);
}

export function clearOperations(): Promise<void> {
  return apiClient.delete(BASE);
}
