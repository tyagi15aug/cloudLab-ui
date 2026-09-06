import { expect, test } from "@playwright/test";

test.describe("theme switching", () => {
  test("toggling to dark applies the dark theme and persists across reload", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole("radio", { name: "Dark theme" }).click();
    await expect(html).toHaveClass(/dark/);

    // index.html's inline pre-paint script reads this back from
    // localStorage before React even mounts — reloading is the real test
    // of "no flash of the wrong theme", not just in-memory state.
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole("radio", { name: "Dark theme" })).toHaveAttribute("aria-checked", "true");

    await page.getByRole("radio", { name: "Light theme" }).click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
