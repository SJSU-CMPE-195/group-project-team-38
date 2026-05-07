import type { EvaluationResult, ReportSummary } from "../types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function modelKey(result: Pick<EvaluationResult, "provider" | "model">) {
  return `${result.provider}/${result.model}`;
}

function summarizeModelGroups(results: EvaluationResult[]) {
  const groups = new Map<string, EvaluationResult[]>();
  for (const result of results) {
    const key = modelKey(result);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const [provider, model] = key.split("/") as [EvaluationResult["provider"], string];
      const scored = group.filter((result) => result.automatedScore);
      const failures = group.filter(
        (result) => result.providerError || result.automatedScore?.flags.includes("empty_response"),
      );

      return {
        provider,
        model,
        tier: group[0]?.modelTier,
        averageScore: Number(
          average(scored.map((result) => result.automatedScore?.weightedFinalScore ?? 0)).toFixed(
            2,
          ),
        ),
        averageLatencyMs: Math.round(average(group.map((result) => result.latencyMs))),
        failureRate: Number((failures.length / group.length).toFixed(2)),
        safetyFlagCount: group.reduce(
          (sum, result) => sum + (result.automatedScore?.flags.length ?? 0),
          0,
        ),
        hallucinationFlagCount: group.reduce(
          (sum, result) =>
            sum +
            (result.automatedScore?.flags.filter((flag) =>
              [
                "invented_patient_data",
                "invented_medication_fact",
                "overconfident_diagnosis",
              ].includes(flag),
            ).length ?? 0),
          0,
        ),
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || a.failureRate - b.failureRate);
}

export function summarizeResults(runName: string, results: EvaluationResult[]): ReportSummary {
  const models = summarizeModelGroups(results);

  const bestModelByCategory: Record<string, string> = {};
  const categories = new Set(results.map((result) => result.caseCategory));
  for (const category of categories) {
    const categoryResults = results.filter((result) => result.caseCategory === category);
    const categorySummary = summarizeModelGroups(categoryResults)[0];
    if (categorySummary) {
      bestModelByCategory[category] = `${categorySummary.provider}/${categorySummary.model}`;
    }
  }

  const bestOverallModel = models[0] ? `${models[0].provider}/${models[0].model}` : undefined;
  const recommendation = bestOverallModel
    ? `Use ${bestOverallModel} as the current front-runner for manual review, pending clinician or instructor validation of flagged cases.`
    : "No runnable model results were available. Check provider keys and selected model names.";

  return {
    runName,
    generatedAt: new Date().toISOString(),
    totalResults: results.length,
    bestOverallModel,
    models,
    bestModelByCategory,
    recommendation,
  };
}

export function generateMarkdownReport(summary: ReportSummary, results: EvaluationResult[]) {
  const tableRows = summary.models
    .map((model) =>
      [
        `${model.provider}/${model.model}`,
        model.tier ?? "n/a",
        model.averageScore.toFixed(2),
        String(model.averageLatencyMs),
        `${Math.round(model.failureRate * 100)}%`,
        String(model.safetyFlagCount),
        String(model.hallucinationFlagCount),
      ].join(" | "),
    )
    .join("\n");

  const bestExamples = [...results]
    .filter((result) => result.automatedScore && !result.providerError)
    .sort(
      (a, b) =>
        (b.automatedScore?.weightedFinalScore ?? 0) - (a.automatedScore?.weightedFinalScore ?? 0),
    )
    .slice(0, 3);

  const failedExamples = results
    .filter((result) => result.providerError || (result.automatedScore?.flags.length ?? 0) > 0)
    .slice(0, 5);

  return [
    `# MediTag LLM Evaluation Report`,
    "",
    `Run: ${summary.runName}`,
    `Generated: ${summary.generatedAt}`,
    `Total results: ${summary.totalResults}`,
    "",
    "## Recommendation",
    "",
    summary.recommendation,
    "",
    "## Model Comparison",
    "",
    "Model | Tier | Avg score | Avg latency ms | Failure rate | Safety flags | Hallucination flags",
    "--- | --- | ---: | ---: | ---: | ---: | ---:",
    tableRows || "No results | n/a | 0.00 | 0 | 0% | 0 | 0",
    "",
    "## Best Model By Category",
    "",
    Object.entries(summary.bestModelByCategory)
      .map(([category, model]) => `- ${category}: ${model}`)
      .join("\n") || "- No category winners available.",
    "",
    "## Example Best Responses",
    "",
    bestExamples
      .map(
        (result) =>
          `### ${result.provider}/${result.model} on ${result.caseId}\n\nScore: ${
            result.automatedScore?.weightedFinalScore ?? "n/a"
          }\n\n${result.normalizedExplanationText}`,
      )
      .join("\n\n") || "No successful responses available.",
    "",
    "## Flagged Or Failed Responses",
    "",
    failedExamples
      .map(
        (result) =>
          `### ${result.provider}/${result.model} on ${result.caseId}\n\nFlags: ${
            result.automatedScore?.flags.join(", ") || "provider_error"
          }\n\n${result.providerError ?? result.normalizedExplanationText}`,
      )
      .join("\n\n") || "No flagged responses.",
    "",
    "## Safety Limitation",
    "",
    "This internal report compares model behavior only. It does not provide clinical validation and should not be treated as medical approval.",
    "",
  ].join("\n");
}

export function generateCsvResults(results: EvaluationResult[]) {
  const rows = [
    [
      "timestamp",
      "provider",
      "model",
      "case_id",
      "case_category",
      "score",
      "latency_ms",
      "flags",
      "provider_error",
    ],
    ...results.map((result) => [
      result.timestamp,
      result.provider,
      result.model,
      result.caseId,
      result.caseCategory,
      String(result.automatedScore?.weightedFinalScore ?? ""),
      String(result.latencyMs),
      result.automatedScore?.flags.join(";") ?? "",
      result.providerError ?? "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
