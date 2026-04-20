# Test Index

This repository keeps executable tests close to the app or package they verify, and this folder serves as the milestone-facing index required for Implementation 3.

- `unit/` indexes isolated backend configuration and helper tests
- `integration/` indexes Convex data-flow and admin review tests
- `e2e/` indexes browser, native, and load-test coverage

Primary executable suites:

- Backend unit/integration: `packages/backend/tests/*.test.ts`
- Web E2E: `apps/web/tests/e2e/*.spec.ts`
- Native E2E: `apps/native/.maestro/*.yaml`
- Web stress test: `tests/e2e/web-health-stress.mjs`
