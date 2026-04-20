const defaults = {
  url: "http://127.0.0.1:3001/api/health",
  concurrency: 20,
  durationSeconds: 15,
  timeoutMs: 5_000,
};

function parseArgs(argv) {
  const values = { ...defaults };

  for (const arg of argv) {
    if (arg.startsWith("--url=")) values.url = arg.slice("--url=".length);
    if (arg.startsWith("--concurrency="))
      values.concurrency = Number(arg.slice("--concurrency=".length));
    if (arg.startsWith("--duration="))
      values.durationSeconds = Number(arg.slice("--duration=".length));
    if (arg.startsWith("--timeout=")) values.timeoutMs = Number(arg.slice("--timeout=".length));
  }

  return values;
}

function percentile(sortedValues, target) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((target / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index];
}

async function hit(url, timeoutMs) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "cache-control": "no-cache",
      },
    });

    await response.text();
    return {
      ok: response.ok,
      durationMs: performance.now() - started,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: performance.now() - started,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const stopAt = Date.now() + config.durationSeconds * 1_000;
  const results = [];

  async function worker() {
    while (Date.now() < stopAt) {
      results.push(await hit(config.url, config.timeoutMs));
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));

  const latencies = results.map((result) => result.durationMs).sort((a, b) => a - b);
  const successful = results.filter((result) => result.ok).length;
  const failures = results.length - successful;
  const average =
    results.reduce((total, result) => total + result.durationMs, 0) / Math.max(results.length, 1);
  const throughput = results.length / Math.max(config.durationSeconds, 1);
  const errorRate = (failures / Math.max(results.length, 1)) * 100;
  const statusCounts = results.reduce((counts, result) => {
    const key = String(result.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const summary = {
    url: config.url,
    concurrency: config.concurrency,
    durationSeconds: config.durationSeconds,
    timeoutMs: config.timeoutMs,
    totalRequests: results.length,
    successfulRequests: successful,
    failedRequests: failures,
    averageResponseMs: Number(average.toFixed(2)),
    p95ResponseMs: Number(percentile(latencies, 95).toFixed(2)),
    p99ResponseMs: Number(percentile(latencies, 99).toFixed(2)),
    requestsPerSecond: Number(throughput.toFixed(2)),
    errorRatePercent: Number(errorRate.toFixed(2)),
    statusCounts,
  };

  console.log(JSON.stringify(summary, null, 2));
}

await main();
