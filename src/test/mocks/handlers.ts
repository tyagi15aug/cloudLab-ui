import { http, HttpResponse } from "msw";
import type {
  BucketList,
  BucketResource,
  DynamoItem,
  MessageResource,
  QueueResource,
  TableResource,
} from "../../api/types";

export const sampleBuckets: BucketResource[] = [
  {
    id: "demo-assets",
    name: "demo-assets",
    region: "us-east-1",
    created_at: "2026-01-15T10:00:00Z",
    tags: {},
  },
  {
    id: "test-bucket",
    name: "test-bucket",
    region: "us-east-1",
    created_at: "2026-02-01T08:30:00Z",
    tags: {},
  },
];

/** Default happy-path handlers. Individual tests override these with
 * server.use(...) for error/empty/loading scenarios. */
export const handlers = [
  http.get("/api/resources/s3/buckets", () => {
    return HttpResponse.json<BucketList>({ items: sampleBuckets, next_cursor: null });
  }),

  http.post("/api/resources/s3/buckets", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json<BucketResource>(
      { id: body.name, name: body.name, region: "us-east-1", created_at: new Date().toISOString(), tags: {} },
      { status: 201 },
    );
  }),

  http.delete("/api/resources/s3/buckets/:name", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/health", () => {
    return HttpResponse.json({ status: "ok", provider: "localstack" });
  }),

  // -- SQS -------------------------------------------------------------
  http.post("/api/resources/sqs/queues", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json<QueueResource>(
      {
        id: body.name,
        name: body.name,
        url: `http://localhost:4566/000000000000/${body.name}`,
        arn: `arn:aws:sqs:us-east-1:000000000000:${body.name}`,
        region: "us-east-1",
        created_at: new Date().toISOString(),
        approximate_message_count: 0,
        tags: {},
      },
      { status: 201 },
    );
  }),

  http.delete("/api/resources/sqs/queues/:name", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/resources/sqs/queues/:name/messages", async ({ request }) => {
    const body = (await request.json()) as { body: string };
    return HttpResponse.json<MessageResource>(
      {
        message_id: "msg-1",
        receipt_handle: "",
        body: body.body,
        sent_at: null,
        approximate_receive_count: null,
      },
      { status: 201 },
    );
  }),

  http.get("/api/resources/sqs/queues/:name/messages", () => {
    return HttpResponse.json({ items: [] });
  }),

  http.post("/api/resources/sqs/queues/:name/messages/delete", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // -- DynamoDB ----------------------------------------------------------
  http.post("/api/resources/dynamodb/tables", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      partition_key: string;
      partition_key_type?: string;
      sort_key?: string;
      sort_key_type?: string;
    };
    return HttpResponse.json<TableResource>(
      {
        id: body.name,
        name: body.name,
        arn: `arn:aws:dynamodb:us-east-1:000000000000:table/${body.name}`,
        region: "us-east-1",
        status: "ACTIVE",
        item_count: 0,
        created_at: Date.now() / 1000,
        partition_key: { name: body.partition_key, type: (body.partition_key_type ?? "S") as "S" | "N" | "B" },
        sort_key: body.sort_key ? { name: body.sort_key, type: (body.sort_key_type ?? "S") as "S" | "N" | "B" } : null,
      },
      { status: 201 },
    );
  }),

  http.delete("/api/resources/dynamodb/tables/:name", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/resources/dynamodb/tables/:name/items", async ({ request }) => {
    const body = (await request.json()) as { item: DynamoItem };
    return HttpResponse.json<DynamoItem>(body.item, { status: 201 });
  }),

  http.get("/api/resources/dynamodb/tables/:name/items", () => {
    return HttpResponse.json({ items: [], next_cursor: null });
  }),

  http.post("/api/resources/dynamodb/tables/:name/items/delete", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
