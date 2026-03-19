import { expect, test } from "@playwright/test";

test.describe("admin review dashboard", () => {
  test("renders fixture-backed review detail for a failed scan", async ({ page }) => {
    await page.goto("/dashboard?fixture=admin-review");

    await expect(page.getByText("Recent scan events")).toBeVisible();
    await expect(page.getByTestId("scan-log-list")).toBeVisible();
    await expect(page.getByTestId("scan-log-detail")).toContainText("Log detail");
    await expect(page.getByTestId("scan-log-detail")).toContainText("Demo Conflict Patient");
    await expect(page.getByTestId("scan-log-detail")).toContainText("Allergy conflict");
    await expect(page.getByTestId("scan-log-detail")).toContainText("Explanation ready");
    await expect(page.getByTestId("scan-log-detail")).toContainText(
      "deterministic check blocked amoxicillin before administration",
    );
  });

  test("filters the review list and can switch detail rows", async ({ page }) => {
    await page.goto("/dashboard?fixture=admin-review");

    const list = page.getByTestId("scan-log-list");

    await page.getByTestId("scan-log-search").fill("Acetaminophen");
    await expect(list).toContainText("Demo Safe Patient");
    await expect(list).not.toContainText("Demo Conflict Patient");

    await page.getByTestId("scan-log-reset-filters").click();
    await expect(list).toContainText("Demo Conflict Patient");

    await page.getByTestId("scan-log-result-filter").selectOption("pass");
    await expect(list).toContainText("Demo Safe Patient");
    await expect(list).not.toContainText("Demo Conflict Patient");

    await page.getByTestId("scan-log-view-detail-fixture-scan-log-safe").click();
    await expect(page.getByTestId("scan-log-detail")).toContainText("Demo Safe Patient");
    await expect(page.getByTestId("scan-log-detail")).toContainText("Pass");
    await expect(page.getByTestId("scan-log-detail")).toContainText("No explanation");
  });

  test("narrows logs by date window", async ({ page }) => {
    await page.goto("/dashboard?fixture=admin-review");

    const list = page.getByTestId("scan-log-list");
    await page.getByTestId("scan-log-from-date").fill("2026-03-19");
    await page.getByTestId("scan-log-to-date").fill("2026-03-19");

    await expect(list).toContainText("Demo Conflict Patient");
    await expect(list).not.toContainText("Demo Safe Patient");
    await expect(page.getByTestId("scan-log-detail")).toContainText("Demo Conflict Patient");
  });
});
