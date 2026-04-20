# End-to-End Tests

Current E2E coverage is split by surface:

- Web browser flows: `apps/web/tests/e2e/smoke.spec.ts` and `apps/web/tests/e2e/admin-review.spec.ts`
- Native simulator flows: `apps/native/.maestro/smoke.yaml`, `apps/native/.maestro/nurse-safe-path.yaml`, `apps/native/.maestro/nurse-conflict-ai.yaml`
- Web health stress harness: `tests/e2e/web-health-stress.mjs`

Run commands:

```sh
bun run test:e2e:web
bun run test:e2e:native
bun run test:e2e:native:demo
bun run stress:test:web -- --url=http://127.0.0.1:3001/api/health
```
