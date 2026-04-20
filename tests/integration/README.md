# Integration Tests

Current integration coverage lives in the backend package:

- `packages/backend/tests/verification.test.ts`
- `packages/backend/tests/scanLogs.test.ts`
- `packages/backend/tests/scanLogExplanations.test.ts`
- `packages/backend/tests/ai.integration.test.ts`

What is covered:

- authenticated medication verification flows
- scan context resolution
- append-only scan logging
- admin review queries with joins and filters
- AI explanation generation success/failure paths
