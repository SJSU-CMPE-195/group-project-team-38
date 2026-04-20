import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["convex/**/*.ts"],
      exclude: [
        "convex/**/*.d.ts",
        "convex/**/*.js",
        "convex/**/_generated/**",
        "convex/**/README.md",
        "convex/convex.config.ts",
      ],
      reporter: ["text-summary", "json-summary", "html", "lcov"],
      reportsDirectory: "../../docs/evaluation/coverage-report/backend",
    },
  },
});
