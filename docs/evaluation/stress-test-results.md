---
summary: "Stress-test methodology and observed results for the MediTag web health endpoint"
read_when:
  - Preparing the Implementation 3 evaluation submission
  - Answering how the deployed web surface behaves under concurrent request load
  - Updating performance numbers after a new benchmark run
title: "Implementation 3 Stress Test Results"
---

# Stress Test Results

This report captures the reproducible load-test setup used for Implementation 3. The current target is the web health endpoint at `/api/health`, which is appropriate for deployment smoke checks and repeatable response-time measurement.

## Test Configuration

- Tool: `bun tests/e2e/web-health-stress.mjs`
- Run date: April 16, 2026
- Environment: local production `next start` server for `apps/web`
- Duration: 15 seconds
- Virtual Users: 25 concurrent workers
- Timeout per request: 5000 ms
- Target: `http://127.0.0.1:3001/api/health`

## Results

| Metric            | Value    |
| ----------------- | -------- |
| Total Requests    | 116,246  |
| Avg Response Time | 3.23 ms  |
| 95th Percentile   | 5.36 ms  |
| 99th Percentile   | 7.30 ms  |
| Requests/Second   | 7,749.73 |
| Error Rate        | 0%       |

## Observations

- The lightweight health endpoint remained stable for the full run and returned `200` for every request.
- At this load level, the bottleneck was not application logic; the route is effectively a deployment health probe and stayed comfortably below 10 ms even at p99.
- These numbers should be presented as a smoke-load benchmark, not as a full system concurrency claim for nurse verification or Convex-backed workflows.
- A stronger next step would be a second benchmark against authenticated dashboard or verification endpoints after staging deployment secrets are configured.
