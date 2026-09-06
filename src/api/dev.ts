import { apiClient } from "./client";
import type { CreateFailureRuleRequest, FailureRuleList, FailureRuleResource, FailureType } from "./types";

const BASE = "/api/dev/failures";

/** Mirrors app/models/failure_injection.py's KNOWN_SERVICES/KNOWN_OPERATIONS
 * — used only to populate the Developer Tools page's pick-lists. The
 * backend itself doesn't restrict `service`/`operation` to these values
 * (a rule for an unrecognized pair just never matches anything), so this
 * list existing out of sync would be a UX gap, not a correctness bug. */
export const KNOWN_SERVICES = ["*", "s3", "sqs", "dynamodb"] as const;

export const KNOWN_OPERATIONS_BY_SERVICE: Record<string, string[]> = {
  "*": ["*"],
  s3: ["*", "ListBuckets", "CreateBucket", "DeleteBucket", "HeadBucket", "GetBucketLocation", "GetBucketTagging"],
  sqs: [
    "*",
    "ListQueues",
    "CreateQueue",
    "DeleteQueue",
    "GetQueueUrl",
    "GetQueueAttributes",
    "SendMessage",
    "ReceiveMessage",
    "DeleteMessage",
  ],
  dynamodb: ["*", "ListTables", "CreateTable", "DeleteTable", "DescribeTable", "Scan", "PutItem", "DeleteItem"],
};

export const FAILURE_TYPES: { value: FailureType; label: string; description: string }[] = [
  { value: "http_500", label: "HTTP 500", description: "Internal server error — not retryable." },
  { value: "http_403", label: "HTTP 403", description: "Access denied — not retryable." },
  { value: "timeout", label: "Timeout", description: "Delays, then fails as unavailable — retryable." },
  { value: "latency", label: "Latency", description: "Delays, then succeeds normally." },
  { value: "throttle", label: "Throttle", description: "429 throttled — retryable." },
  { value: "connection_failure", label: "Connection failure", description: "Provider unreachable — retryable." },
];

export function listFailures(): Promise<FailureRuleList> {
  return apiClient.get<FailureRuleList>(BASE);
}

export function createFailure(request: CreateFailureRuleRequest): Promise<FailureRuleResource> {
  return apiClient.post<FailureRuleResource>(BASE, request);
}

export function deleteFailure(id: string): Promise<void> {
  return apiClient.delete(`${BASE}/${encodeURIComponent(id)}`);
}

export function clearFailures(): Promise<void> {
  return apiClient.delete(BASE);
}
