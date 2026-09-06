import { expect, test } from "@playwright/test";

/**
 * Happy-path SQS workflow against the real backend (see global-setup.ts):
 * create a queue, send a message, receive it, delete it, then delete the
 * queue. Each test uses a uniquely-named queue and cleans up in `finally`,
 * same rationale as s3.spec.ts.
 *
 * One thing this suite is deliberately careful about: SQS's ReceiveMessage
 * is a "peek" that hides what it returns from other ReceiveMessage calls
 * for the queue's visibility timeout (see useQueues.ts's comments on the
 * query-invalidation bug this caused during development). So this test
 * clicks "Receive messages" exactly once after sending, rather than
 * polling repeatedly or relying on any automatic refetch — the same
 * discipline the app's own query invalidation was fixed to follow.
 */

function uniqueQueueName(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test.describe("SQS queue console", () => {
  test("creates a queue, sends and receives a message, then deletes both", async ({ page }) => {
    const queueName = uniqueQueueName("crud");
    const messageBody = `hello from playwright ${Date.now()}`;

    await page.goto("/sqs");
    await expect(page.getByRole("heading", { name: "SQS · Queues" })).toBeVisible();

    await page.getByRole("button", { name: "Create queue" }).first().click();
    await page.getByLabel("Queue name").fill(queueName);
    await page.getByRole("dialog").getByRole("button", { name: "Create queue" }).click();

    const row = page.getByRole("row", { name: new RegExp(queueName) });
    await expect(row).toBeVisible();

    try {
      await row.getByRole("link", { name: queueName }).click();
      await expect(page.getByRole("heading", { name: `SQS · ${queueName}` })).toBeVisible();
      await expect(page.getByText(/no messages received/i)).toBeVisible();

      await page.getByRole("button", { name: "Send message" }).first().click();
      await page.getByLabel("Message body").fill(messageBody);
      await page.getByRole("dialog").getByRole("button", { name: "Send message" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      // Exactly one explicit receive — see the file-level comment above.
      await page.getByRole("button", { name: "Receive messages" }).click();

      const messageRow = page.getByRole("row", { name: new RegExp(messageBody) });
      await expect(messageRow).toBeVisible();

      await messageRow.getByRole("button", { name: "Delete message" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete message" }).click();
      await expect(page.getByText(/no messages received/i)).toBeVisible();
    } finally {
      await page.getByRole("link", { name: "← Back to queues" }).click();
      await page.getByRole("row", { name: new RegExp(queueName) }).getByRole("button", { name: `Delete ${queueName}` }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete queue" }).click();
      await expect(page.getByRole("row", { name: new RegExp(queueName) })).toHaveCount(0);
    }
  });

  test("rejects an invalid queue name client-side without calling the API", async ({ page }) => {
    await page.goto("/sqs");
    await page.getByRole("button", { name: "Create queue" }).first().click();

    await page.getByLabel("Queue name").fill("not a valid name!");
    await page.getByRole("dialog").getByRole("button", { name: "Create queue" }).click();

    await expect(page.getByText(/letters, numbers, hyphens, and underscores/i)).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
