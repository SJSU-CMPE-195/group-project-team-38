## Stress Test Results

Three endpoints were tested at the same concurrency and duration to separate deployment smoke performance from real production-route rendering

1. `/api/health` - deployment smoke probe (baseline ceiling for the Node server)
2. `/dashboard` - production App Router route rendering the unauthenticated landing with the sign-in card and Convex/Auth providers fully instantiated (~12 KB HTML)
3. `/dashboard?fixture=admin-review` - production App Router route rendering the full admin scan-review UI (filters, metric cards, scan log list, detail panel) with deterministic fixture data (~29 KB HTML)

### Test Configuration

- Tool: `bun tests/e2e/web-health-stress.mjs` (Bun-based HTTP load runner, parallel `fetch` workers with latency/percentile aggregation)
- Run date: April 19, 2026
- Duration: 30 seconds per run
- Virtual Users: 50 concurrent
- Timeout per request: 10,000 ms
- Target: local production `next start` server for `apps/web` (Next.js 16.1.6, Node 22) on port 3001, with `NEXT_PUBLIC_E2E_ADMIN_FIXTURE=1` enabled for the admin fixture path
- Targets exercised:
  - `/api/health`
  - `/dashboard`
  - `/dashboard?fixture=admin-review`

Reproduction:

```sh
cd apps/web && PORT=3001 NEXT_PUBLIC_E2E_ADMIN_FIXTURE=1 bun run start &

bun tests/e2e/web-health-stress.mjs --url=http://127.0.0.1:3001/api/health --concurrency=50 --duration=30 --timeout=10000
bun tests/e2e/web-health-stress.mjs --url=http://127.0.0.1:3001/dashboard --concurrency=50 --duration=30 --timeout=10000
bun tests/e2e/web-health-stress.mjs --url="http://127.0.0.1:3001/dashboard?fixture=admin-review" --concurrency=50 --duration=30 --timeout=10000
```

### Results

| Metric            | `/api/health` | `/dashboard` | `/dashboard?fixture=admin-review` |
| ----------------- | ------------- | ------------ | --------------------------------- |
| Avg Response Time | 5.80 ms       | 47.05 ms     | 58.18 ms                          |
| 95th Percentile   | 7.44 ms       | 54.33 ms     | 68.29 ms                          |
| 99th Percentile   | 11.47 ms      | 66.09 ms     | 72.52 ms                          |
| Requests/Second   | 8,624.27      | 1,062.83     | 859.47                            |
| Total Requests    | 258,728       | 31,885       | 25,784                            |
| Error Rate        | 0%            | 0%           | 0%                                |

### Observations

- **What we learned:** the stack is stable under sustained 50-concurrent load and every run held a 0% error rate and p99 stayed under 75 ms on the production route which is comfortably below the 10,000 ms request budget. The production `/dashboard` route sustains ~1,062 RPS and the admin review surface ~859 RPS on a single local Node process.
- **Primary bottleneck — React Server Component rendering.** The ~8–10× gap between the health probe (8,624 RPS) and the App Router routes (859–1,062 RPS) is the cost of React tree construction, provider wiring (Convex, Better Auth, theme), and HTML serialization per request. The health endpoint serves 74-byte JSON; the dashboard routes serialize 12–29 KB of HTML each.
- **Secondary bottleneck — payload size.** Going from 12 KB (`/dashboard`) to 29 KB (`?fixture=admin-review`) costs ~20% of the RPS ceiling (1,062 to 859), tracking the larger React tree and HTML stream.
- **What we would optimize:** (1) promote the unauthenticated landing card to a static/ISR segment so repeat hits skip the full render, (2) move the admin review filters and metric cards into client components fed from a cached server query so the SSR render path shrinks, (3) ship the payload as a streamed response to move TTFB earlier in the latency budget, and (4) re-run against Vercel's Fluid Compute runtime where per-instance reuse and regional placement will change the absolute numbers.

### Limits and Follow-ups

- Saturation point was not reached in this range so a follow-up should ramp concurrency (50 → 100 → 250 → 500) until p99 latency grows or error rate goes non-zero.
- Fixture mode short-circuits Convex queries; a follow-up run against a seeded Convex deployment would capture the cost of live query waterfalls and websocket subscriptions that this local benchmark does not exercise.
- A production run against the Vercel preview deployment would replace the local `next start` numbers with Fluid Compute numbers from the actual runtime.
