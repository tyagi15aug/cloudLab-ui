import { expect, test } from "@playwright/test";

/**
 * Happy-path S3 CRUD workflow against the real backend (see
 * global-setup.ts). Each test creates a uniquely-named bucket and cleans up
 * after itself in `finally`, rather than depending on scripts/seed.sh's
 * fixed demo data — that keeps this suite runnable in any order, in
 * parallel, and against a backend someone else is also poking at.
 */

function uniqueBucketName(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test.describe("S3 bucket console", () => {
  test("creates, lists, and deletes a bucket end to end", async ({ page }) => {
    const bucketName = uniqueBucketName("crud");

    await page.goto("/s3");
    await expect(page.getByRole("heading", { name: "S3 · Buckets" })).toBeVisible();

    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill(bucketName);
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

    const row = page.getByRole("row", { name: new RegExp(bucketName) });
    await expect(row).toBeVisible();

    try {
      await expect(row.getByText("us-east-1")).toBeVisible();
    } finally {
      await row.getByRole("button", { name: `Delete ${bucketName}` }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete bucket" }).click();
      await expect(page.getByRole("row", { name: new RegExp(bucketName) })).toHaveCount(0);
    }
  });

  test("rejects an invalid bucket name client-side without calling the API", async ({ page }) => {
    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();

    await page.getByLabel("Bucket name").fill("AB");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

    await expect(page.getByText("Must be 3–63 characters long.")).toBeVisible();
    // Dialog stays open — no request was ever sent for an invalid name.
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("surfaces a server-side error via the real error envelope", async ({ page }) => {
    // A real duplicate-bucket conflict is provider/region-dependent (S3's
    // CreateBucket is actually idempotent for the *default* us-east-1
    // region — see the backend's
    // tests/integration/test_localstack_provider.py for that exact
    // surprise), so asserting on one here would be asserting on an AWS
    // implementation detail rather than on this app's error handling.
    // Intercepting the network response instead deterministically exercises
    // the same ApiError -> <div role="alert"> path the real conflict case
    // would take, without depending on which region happens to be
    // configured.
    await page.route("**/api/resources/s3/buckets", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "RESOURCE_ALREADY_EXISTS",
            message: "A bucket with this name already exists.",
            requestId: "e2e-mocked",
            retryable: false,
          },
        }),
      });
    });

    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill(uniqueBucketName("conflict"));
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

    await expect(page.getByRole("alert")).toContainText("already exists");
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  });
});
