import { expect, test } from "@playwright/test";

/**
 * These simulate backend failure/latency by intercepting the network at the
 * browser layer (Playwright's `page.route`) rather than through the real
 * backend. Phase 4 of the plan adds a real failure-injection layer between
 * the provider and LocalStack (500s/timeouts/throttling injected
 * server-side); once that exists, this file is where the equivalent
 * "does the UI actually handle it" tests belong, switched from route
 * interception to driving the real injection API. Until then, this is the
 * honest way to test the UI's failure paths without a real failure source.
 */

test.describe("resilience: backend failure handling", () => {
  test("shows a retryable error state when the buckets list fails to load", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/api/resources/s3/buckets**", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      requestCount += 1;
      // The QueryClient is configured with retry: 1 (main.tsx), so TanStack
      // Query silently retries once before surfacing an error — fail the
      // first two attempts (initial + automatic retry) so the error state
      // actually renders, then let the user's manual Retry click through.
      if (requestCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "INTERNAL_ERROR",
              message: "An unexpected error occurred.",
              requestId: "e2e-mocked",
              retryable: true,
            },
          }),
        });
        return;
      }
      return route.fallback();
    });

    await page.goto("/s3");

    await expect(page.getByRole("alert")).toContainText("An unexpected error occurred.");
    await page.getByRole("button", { name: "Retry" }).click();

    // Once the mocked failure is consumed, the retry hits the real backend
    // and the normal table/empty state renders instead of the error state.
    await expect(page.getByText("Couldn't load this")).toHaveCount(0);
  });

  test("keeps the create dialog open and shows the message on a 503", async ({ page }) => {
    await page.route("**/api/resources/s3/buckets", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "PROVIDER_UNAVAILABLE",
            message: "The cloud provider is temporarily unavailable.",
            requestId: "e2e-mocked",
            retryable: true,
          },
        }),
      });
    });

    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("e2e-unavailable-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

    await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
    // The dialog must not have closed on failure — only CreateBucketDialog's
    // onSuccess callback closes it.
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
