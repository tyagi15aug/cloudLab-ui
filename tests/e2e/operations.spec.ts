import { expect, test } from "@playwright/test";

/**
 * Phase 5: the Developer Tools / Operations page end to end against the
 * real backend — a real resource action performed through the UI should
 * show up in `/api/dev/operations` and its metrics, and an operation
 * detail should be inspectable. Operation history is process-wide (the
 * same backend process serves every spec in this suite), so each test
 * clears it in `beforeEach`/`afterEach` the same way failure-injection.spec.ts
 * clears rules, to stay deterministic regardless of run order.
 */

test.describe("Developer Tools: operations", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/dev/operations");
  });

  test.afterEach(async ({ request }) => {
    await request.delete("/api/dev/operations");
    await request.delete("/api/dev/failures");
  });

  test("a real bucket creation shows up in operation history and metrics", async ({ page }) => {
    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("operations-e2e-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();
    await expect(page.getByRole("row", { name: /operations-e2e-test/ })).toBeVisible();

    await page.goto("/dev/operations");
    const row = page.getByRole("row", { name: /CreateBucket/ });
    await expect(row).toBeVisible();
    await expect(row.getByText("operations-e2e-test")).toBeVisible();
    await expect(row.getByText("OK")).toBeVisible();

    // Total requests includes ListBuckets (page load) + CreateBucket, so
    // assert it's at least 1 rather than an exact count tied to fetch timing.
    const totalRequests = page.getByText("Total requests").locator("..").getByText(/^\d+$/);
    await expect(totalRequests).not.toHaveText("0");

    // cleanup
    await page.goto("/s3");
    await page
      .getByRole("row", { name: /operations-e2e-test/ })
      .getByRole("button", { name: "Delete operations-e2e-test" })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete bucket" }).click();
  });

  test("Details opens a dialog with the request id and resource", async ({ page }) => {
    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("operations-detail-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();
    await expect(page.getByRole("row", { name: /operations-detail-test/ })).toBeVisible();

    await page.goto("/dev/operations");
    await page.getByRole("row", { name: /CreateBucket/ }).getByRole("button", { name: "Details" }).click();

    const dialog = page.getByRole("dialog", { name: "Operation detail" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("operations-detail-test")).toBeVisible();
    await expect(dialog.getByText(/^s3 · CreateBucket$/)).toBeVisible();

    // cleanup
    await page.goto("/s3");
    await page
      .getByRole("row", { name: /operations-detail-test/ })
      .getByRole("button", { name: "Delete operations-detail-test" })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete bucket" }).click();
  });

  test("an injected failure is recorded as an error with its error code", async ({ page, request }) => {
    await request.post("/api/dev/failures", {
      data: { service: "s3", operation: "CreateBucket", failure: "http_500" },
    });

    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("operations-error-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();
    await expect(page.getByRole("alert")).toContainText("Injected failure: internal server error.");
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

    await page.goto("/dev/operations");
    const row = page.getByRole("row", { name: /CreateBucket/ });
    await expect(row.getByText("INTERNAL_ERROR")).toBeVisible();
  });

  test("Clear history empties the panel", async ({ page }) => {
    await page.goto("/s3");
    await expect(page.getByRole("heading", { name: "S3 · Buckets" })).toBeVisible();

    await page.goto("/dev/operations");
    await expect(page.getByRole("row", { name: /ListBuckets/ })).toBeVisible();

    await page.getByRole("button", { name: "Clear history" }).click();
    await expect(page.getByText(/no operations recorded yet/i)).toBeVisible();
  });
});
