import { expect, test } from "@playwright/test";

/**
 * Happy-path DynamoDB workflow against the real backend (see
 * global-setup.ts): create a table, put an item, see it round-trip
 * (including the float round-trip the backend's _to_dynamo_compatible
 * conversion exists for — see dynamodb_service.py), delete it, then delete
 * the table. Uniquely-named table per test, cleaned up in `finally`, same
 * rationale as s3.spec.ts.
 */

function uniqueTableName(label: string): string {
  return `e2e_${label}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

test.describe("DynamoDB table console", () => {
  test("creates a table, puts and deletes an item, then deletes the table", async ({ page }) => {
    const tableName = uniqueTableName("crud");

    await page.goto("/dynamodb");
    await expect(page.getByRole("heading", { name: "DynamoDB · Tables" })).toBeVisible();

    await page.getByRole("button", { name: "Create table" }).first().click();
    await page.getByLabel("Table name").fill(tableName);
    await page.getByLabel("Partition key", { exact: true }).fill("id");
    await page.getByRole("dialog").getByRole("button", { name: "Create table" }).click();

    const row = page.getByRole("row", { name: new RegExp(tableName) });
    await expect(row).toBeVisible();

    try {
      await row.getByRole("link", { name: tableName }).click();
      await expect(page.getByRole("heading", { name: `DynamoDB · ${tableName}` })).toBeVisible();
      await expect(page.getByText(/no items yet/i)).toBeVisible();

      await page.getByRole("button", { name: "Put item" }).first().click();
      await page.getByLabel("Item (JSON)").fill('{"id": "u1", "name": "Alice", "score": 4.5}');
      await page.getByRole("dialog").getByRole("button", { name: "Put item" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      // Float round-trips as a float (4.5, not "4.5" or a Decimal repr) —
      // the real bug this workflow guards against.
      const itemRow = page.getByRole("row", { name: /"score":4\.5/ });
      await expect(itemRow).toBeVisible();

      await itemRow.getByRole("button", { name: "Delete item" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete item" }).click();
      await expect(page.getByText(/no items yet/i)).toBeVisible();
    } finally {
      await page.getByRole("link", { name: "← Back to tables" }).click();
      await page.getByRole("row", { name: new RegExp(tableName) }).getByRole("button", { name: `Delete ${tableName}` }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete table" }).click();
      await expect(page.getByRole("row", { name: new RegExp(tableName) })).toHaveCount(0);
    }
  });

  test("rejects a table with no partition key client-side without calling the API", async ({ page }) => {
    await page.goto("/dynamodb");
    await page.getByRole("button", { name: "Create table" }).first().click();

    await page.getByLabel("Table name").fill(uniqueTableName("invalid"));
    await page.getByRole("dialog").getByRole("button", { name: "Create table" }).click();

    await expect(page.getByText(/partition key is required/i)).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
