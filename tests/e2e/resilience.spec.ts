import { expect, test } from "@playwright/test";

/**
 * Phase 4 update: these used to simulate backend failure by intercepting
 * the network at the browser layer (Playwright's `page.route`), because no
 * real failure source existed yet — see git history for that version. Now
 * that `/api/dev/failures` (app/core/failure_injection.py) is real, these
 * drive the actual injection API instead, exercising the real path end to
 * end: UI action -> real HTTP request -> ProviderService._call() ->
 * injected AppError -> real error envelope -> UI error state. Each test
 * clears every rule in `finally` so a failure can't leak into whichever
 * spec runs next.
 */

test.describe("resilience: backend failure handling", () => {
  test("shows a retryable error state when the buckets list fails to load, then recovers once cleared", async ({
    page,
    request,
  }) => {
    await request.post("/api/dev/failures", {
      data: { service: "s3", operation: "ListBuckets", failure: "http_500" },
    });

    try {
      await page.goto("/s3");

      await expect(page.getByRole("alert")).toContainText("Injected failure: internal server error.");
      await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0); // http_500 isn't retryable

      // The plan's Phase 4.5 resilience shape: disable the failure, then
      // retry — the UI should never be permanently stuck because of it.
      await request.delete("/api/dev/failures");
      await page.getByRole("button", { name: "Refresh buckets" }).click();

      await expect(page.getByText("Couldn't load this")).toHaveCount(0);
    } finally {
      await request.delete("/api/dev/failures");
    }
  });

  test("a throttled failure shows a Retry action (unlike the non-retryable 500 above) and recovers", async ({
    page,
    request,
  }) => {
    await request.post("/api/dev/failures", {
      data: { service: "s3", operation: "ListBuckets", failure: "throttle" },
    });

    try {
      await page.goto("/s3");
      await expect(page.getByRole("alert")).toContainText("Injected failure: request throttled.");
      await expect(page.getByRole("button", { name: "Retry" })).toBeVisible(); // throttle IS retryable

      await request.delete("/api/dev/failures");
      await page.getByRole("button", { name: "Retry" }).click();
      await expect(page.getByText("Couldn't load this")).toHaveCount(0);
    } finally {
      await request.delete("/api/dev/failures");
    }
  });

  test("keeps the create dialog open and shows the message on an injected connection failure", async ({
    page,
    request,
  }) => {
    await request.post("/api/dev/failures", {
      data: { service: "s3", operation: "CreateBucket", failure: "connection_failure" },
    });

    try {
      await page.goto("/s3");
      await page.getByRole("button", { name: "Create bucket" }).first().click();
      await page.getByLabel("Bucket name").fill("e2e-unavailable-test");
      await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

      await expect(page.getByRole("alert")).toContainText("could not reach the provider");
      // The dialog must not have closed on failure — only CreateBucketDialog's
      // onSuccess callback closes it.
      await expect(page.getByRole("dialog")).toBeVisible();
    } finally {
      await request.delete("/api/dev/failures");
    }
  });

  test("artificial latency delays a request but still lets it succeed", async ({ page, request }) => {
    // Wait for the page's own initial ListBuckets fetch to actually finish
    // (not just the static heading, which renders before data loads) before
    // injecting the rule below — otherwise clicking "Refresh buckets" can
    // dedupe onto that still-in-flight, undelayed initial query instead of
    // starting a fresh one, making the timing assertion flaky.
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/resources/s3/buckets") && r.request().method() === "GET",
      ),
      page.goto("/s3"),
    ]);
    await expect(page.getByRole("heading", { name: "S3 · Buckets" })).toBeVisible();

    await request.post("/api/dev/failures", {
      data: { service: "s3", operation: "ListBuckets", failure: "latency", delay_ms: 800 },
    });

    try {
      // Time the actual network round trip (not page-lifecycle events,
      // which resolve on the static shell long before the delayed fetch
      // does) — click Refresh and wait for its response.
      const start = Date.now();
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/api/resources/s3/buckets") && r.request().method() === "GET",
        ),
        page.getByRole("button", { name: "Refresh buckets" }).click(),
      ]);
      const elapsedMs = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsedMs).toBeGreaterThanOrEqual(750); // small tolerance under the 800ms delay
      // No error state — latency alone must never surface as a failure.
      await expect(page.getByText("Couldn't load this")).toHaveCount(0);
    } finally {
      await request.delete("/api/dev/failures");
    }
  });
});
