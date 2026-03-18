import { expect, test } from "@playwright/test";

test("home page smoke check", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/meditag/i);
  await expect(page.getByText("API Status")).toBeVisible();
  await expect(page.locator("pre")).toContainText("███");
});
