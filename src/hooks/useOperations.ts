import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearOperations, getOperationMetrics, listOperations } from "../api/operations";

export const operationsQueryKey = ["dev", "operations"] as const;
export const operationMetricsQueryKey = [...operationsQueryKey, "metrics"] as const;

export function useOperations(limit = 50) {
  return useQuery({
    queryKey: [...operationsQueryKey, limit],
    queryFn: () => listOperations(limit),
    // Recent operations change on every resource call anywhere in the
    // console (including other tabs or an E2E test) — poll so the panel
    // stays current without the developer having to hit Refresh.
    refetchInterval: 5000,
  });
}

export function useOperationMetrics() {
  return useQuery({
    queryKey: operationMetricsQueryKey,
    queryFn: getOperationMetrics,
    refetchInterval: 5000,
  });
}

export function useClearOperations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearOperations(),
    onSuccess: () => {
      // Deliberately *not* `exact: true` here, unlike every other
      // invalidation in this app (see useQueues.ts's comments on the
      // Phase 3 SQS bug for why that convention exists). Clearing history
      // is meant to invalidate both the list and the nested metrics query
      // sharing the ["dev","operations"] prefix, and both are idempotent
      // GETs — there's no vanishing-data race like SQS's ReceiveMessage
      // to guard against here, so the cascade is exactly what's wanted.
      queryClient.invalidateQueries({ queryKey: operationsQueryKey });
    },
  });
}
