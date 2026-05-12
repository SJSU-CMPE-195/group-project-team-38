import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "NEXT_PUBLIC_E2E_ADMIN_FIXTURE=1 NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL:-http://127.0.0.1:3210} NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL:-http://127.0.0.1:3211} bun run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
