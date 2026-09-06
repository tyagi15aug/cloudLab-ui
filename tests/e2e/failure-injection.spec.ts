import { expect, test } from "@playwright/test";

/**
 * Phase 4: the Developer Tools / Failure Injection page itself, end to end
 * against the real backend — inject a rule through the UI, watch a real
 * resource action fail because of it, then clear it and watch the same
 * action succeed. Every test clears all rules in `finally` so a failure
 * mid-test can't leak into whichever spec runs next.
 */

test.describe("Developer Tools: failure injection", () => {
  test.afterEach(async ({ request }) => {
    await request.delete("/api/dev/failures");
  });

  test("injecting an HTTP 500 on CreateBucket fails bucket creation until the rule is cleared", async ({
    page,
  }) => {
    await page.goto("/dev/failures");
    await expect(page.getByRole("heading", { name: "Developer Tools · Failure Injection" })).toBeVisible();
    await expect(page.getByText(/no active failure rules/i)).toBeVisible();

    await page.selectOption("#failure-service", "s3");
    await page.selectOption("#failure-operation", "CreateBucket");
    await page.selectOption("#failure-type", "http_500");
    await page.getByRole("button", { name: "Inject failure" }).click();

    const row = page.getByRole("row", { name: /CreateBucket/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell", { name: "0", exact: true })).toBeVisible(); // hit count starts at 0

    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("failure-injection-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();

    await expect(page.getByRole("alert")).toContainText("Injected failure: internal server error.");
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("row", { name: /failure-injection-test/ })).toHaveCount(0);

    // Hit count reflects the failed attempt.
    await page.goto("/dev/failures");
    await expect(page.getByRole("row", { name: /CreateBucket/ }).getByRole("cell").nth(5)).toHaveText("1");

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.getByText(/no active failure rules/i)).toBeVisible();

    await page.goto("/s3");
    await page.getByRole("button", { name: "Create bucket" }).first().click();
    await page.getByLabel("Bucket name").fill("failure-injection-test");
    await page.getByRole("dialog").getByRole("button", { name: "Create bucket" }).click();
    await expect(page.getByRole("row", { name: /failure-injection-test/ })).toBeVisible();

    // cleanup
    await page
      .getByRole("row", { name: /failure-injection-test/ })
      .getByRole("button", { name: "Delete failure-injection-test" })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete bucket" }).click();
  });

  test("a wildcard operation rule affects every operation on that service", async ({ page }) => {
    await page.goto("/dev/failures");
    await page.selectOption("#failure-service", "sqs");
    await page.selectOption("#failure-operation", "*");
    await page.selectOption("#failure-type", "http_403");
    await page.getByRole("button", { name: "Inject failure" }).click();

    await page.goto("/sqs");
    // ListQueues itself is caught by the wildcard, so the page shows the
    // error state rather than the normal list/empty view.
    await expect(page.getByRole("alert")).toContainText("Injected failure: access denied.");
  });

  test("deleting a single rule restores just that rule's behavior", async ({ page }) => {
    await page.goto("/dev/failures");
    await page.selectOption("#failure-service", "s3");
    await page.selectOption("#failure-operation", "CreateBucket");
    await page.selectOption("#failure-type", "http_500");
    await page.getByRole("button", { name: "Inject failure" }).click();

    const row = page.getByRole("row", { name: /CreateBucket/ });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /delete rule/i }).click();

    await expect(page.getByText(/no active failure rules/i)).toBeVisible();
  });
});
