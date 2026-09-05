import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBucket, deleteBucket, listBuckets } from "../api/s3";

export const bucketsQueryKey = ["s3", "buckets"] as const;

export function useBuckets() {
  return useQuery({
    queryKey: bucketsQueryKey,
    queryFn: () => listBuckets({ pageSize: 100 }),
  });
}

export function useCreateBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createBucket(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketsQueryKey });
    },
  });
}

export function useDeleteBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteBucket(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketsQueryKey });
    },
  });
}
