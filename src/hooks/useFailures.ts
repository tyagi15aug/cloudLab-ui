import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearFailures, createFailure, deleteFailure, listFailures } from "../api/dev";
import type { CreateFailureRuleRequest } from "../api/types";

export const failuresQueryKey = ["dev", "failures"] as const;

export function useFailures() {
  return useQuery({
    queryKey: failuresQueryKey,
    queryFn: listFailures,
    // Failure rules are dev-tooling state that can be added from another
    // tab/E2E test at any moment — a short poll keeps the page honest about
    // what's actually active without the user having to hit Refresh.
    refetchInterval: 5000,
  });
}

export function useCreateFailure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateFailureRuleRequest) => createFailure(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: failuresQueryKey, exact: true });
    },
  });
}

export function useDeleteFailure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFailure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: failuresQueryKey, exact: true });
    },
  });
}

export function useClearFailures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearFailures(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: failuresQueryKey, exact: true });
    },
  });
}
