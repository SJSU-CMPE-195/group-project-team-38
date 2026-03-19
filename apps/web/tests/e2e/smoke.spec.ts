import { expect, test } from "@playwright/test";

test("dashboard smoke check", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/meditag/i);
  await expect(page.getByText("Meditag Admin Review")).toBeVisible();
  await expect(page.getByText("Review recent medication scan outcomes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
