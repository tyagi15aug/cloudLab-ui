import { apiClient } from "./client";
import type { BucketList, BucketResource } from "./types";

// Thin wrapper around one backend resource — one function per route, no
// logic beyond building the URL. sqs.ts and dynamodb.ts follow the same
// shape; hooks/useBuckets.ts is what actually calls these.
const BASE = "/api/resources/s3/buckets";

export interface ListBucketsParams {
  pageSize?: number;
  cursor?: string;
}

export function listBuckets({ pageSize, cursor }: ListBucketsParams = {}): Promise<BucketList> {
  const params = new URLSearchParams();
  if (pageSize) params.set("page_size", String(pageSize));
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return apiClient.get<BucketList>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export function getBucket(name: string): Promise<BucketResource> {
  return apiClient.get<BucketResource>(`${BASE}/${encodeURIComponent(name)}`);
}

export function createBucket(name: string): Promise<BucketResource> {
  return apiClient.post<BucketResource>(BASE, { name });
}

export function deleteBucket(name: string): Promise<void> {
  return apiClient.delete(`${BASE}/${encodeURIComponent(name)}`);
}
