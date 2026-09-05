// Mirrors cloud-control-plane-api's app/models/resource.py exactly. Keeping
// this file in sync by hand (rather than codegen) is a fine tradeoff at
// this scale — one resource, four fields — see docs/adr if that changes.

export interface BucketResource {
  id: string;
  name: string;
  region: string;
  created_at: string | null;
  tags: Record<string, string>;
}

export interface BucketList {
  items: BucketResource[];
  next_cursor: string | null;
}

export interface CreateBucketRequest {
  name: string;
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_ALREADY_EXISTS"
  | "RESOURCE_CONFLICT"
  | "ACCESS_DENIED"
  | "THROTTLED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR";

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  requestId: string | null;
  retryable: boolean;
}

export interface ErrorResponsePayload {
  error: ErrorBody;
}
