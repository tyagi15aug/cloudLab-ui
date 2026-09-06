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

// -- SQS (mirrors app/models/sqs.py) ----------------------------------------

export interface QueueResource {
  id: string;
  name: string;
  url: string;
  arn: string;
  region: string;
  created_at: string | null;
  approximate_message_count: number;
  tags: Record<string, string>;
}

export interface QueueList {
  items: QueueResource[];
}

export interface MessageResource {
  message_id: string;
  receipt_handle: string;
  body: string;
  sent_at: string | null;
  approximate_receive_count: number | null;
}

export interface MessageList {
  items: MessageResource[];
}

// -- DynamoDB (mirrors app/models/dynamodb.py) -------------------------------

export type AttributeType = "S" | "N" | "B";

export interface KeyAttribute {
  name: string;
  type: AttributeType;
}

export interface TableResource {
  id: string;
  name: string;
  arn: string;
  region: string;
  status: string;
  item_count: number;
  created_at: number | null;
  partition_key: KeyAttribute;
  sort_key: KeyAttribute | null;
}

export interface TableList {
  items: TableResource[];
  next_cursor: string | null;
}

export interface CreateTableRequest {
  name: string;
  partition_key: string;
  partition_key_type?: AttributeType;
  sort_key?: string;
  sort_key_type?: AttributeType;
}

export type DynamoItem = Record<string, unknown>;

export interface ItemList {
  items: DynamoItem[];
  next_cursor: string | null;
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
