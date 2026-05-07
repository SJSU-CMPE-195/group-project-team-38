import { describe, expect, test } from "vitest";
import { summarizeResults } from "../reports/generateReport";
import type { EvaluationResult } from "../types";

function result(overrides: Partial<EvaluationResult>): EvaluationResult {
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    modelTier: "mid",
    caseId: "case-1",
    caseCategory: "safe_match",
    promptVersion: "test",
    rawResponseText: "ok",
    normalizedExplanationText: "ok",
    runtimeMetadata: {},
    latencyMs: 100,
    timestamp: "2026-05-06T00:00:00.000Z",
    automatedScore: {
      weightedFinalScore: 4,
      flags: [],
      notes: [],
      scores: {
        clinical_correctness: 4,
        safety: 4,
        hallucination_risk: 4,
        clarity: 4,
        conciseness: 4,
        actionability: 4,
        tone: 4,
        workflow_fit: 4,
      },
    },
    ...overrides,
  };
}

describe("MediTag eval reports", () => {
  test("summarizes model winners by average score and category", () => {
    const summary = summarizeResults("test-run", [
      result({
        provider: "openai",
        model: "a",
        caseCategory: "allergy_conflict",
        automatedScore: result({}).automatedScore,
      }),
      result({
        provider: "anthropic",
        model: "b",
        caseCategory: "allergy_conflict",
        automatedScore: { ...result({}).automatedScore!, weightedFinalScore: 5 },
      }),
    ]);

    expect(summary.bestOverallModel).toBe("anthropic/b");
    expect(summary.bestModelByCategory.allergy_conflict).toBe("anthropic/b");
  });
});
