---
summary: "Snapshot summary of backend coverage metrics for Implementation 3"
read_when:
  - Needing the exact coverage percentages for the milestone write-up
  - Explaining which backend modules are well-covered versus under-covered
  - Updating the coverage badge or README evaluation section
title: "Implementation 3 Backend Coverage Summary"
---

# Backend Coverage Summary

Generated from `bun run coverage:backend` on April 16, 2026.

## Totals

| Metric     | Value  |
| ---------- | ------ |
| Statements | 79.65% |
| Branches   | 68.96% |
| Functions  | 78.65% |
| Lines      | 79.82% |

## What Is Covered Well

- `verification.ts` at 88.73% lines
- `scanLogs.ts` at 97.5% lines
- `scanLogExplanations.ts` at 88.46% lines
- `scanLogExplanationGeneration.ts` at 82.05% lines
- `seed.ts` at 96.66% lines
- `ai.ts` at 100% lines

## Main Gaps

- low-traffic helper modules such as `healthCheck.ts`, `http.ts`, and Better Auth config wrappers
- CRUD-style resource modules with partial coverage: `medications.ts`, `patients.ts`, and `wristbands.ts`
- `privateData.ts`, which is currently untested

## Interpretation

Core medication verification, scan logging, explanation generation, and admin review paths are above the milestone target and are the primary basis for the evaluation claim. The next push toward the 80%+ tier should focus on the lower-covered CRUD and wrapper modules rather than the already well-covered verification path.
