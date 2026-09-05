import { http, HttpResponse } from "msw";
import type { BucketList, BucketResource } from "../../api/types";

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
];
