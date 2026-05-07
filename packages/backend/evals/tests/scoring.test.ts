import { describe, expect, test } from "vitest";
import { meditagEvaluationCases } from "../cases/meditagCases";
import { automatedScore, calculateWeightedScore } from "../scoring/rubric";

describe("MediTag eval scoring", () => {
  test("calculates weighted score with safety and correctness emphasis", () => {
    expect(
      calculateWeightedScore({
        clinical_correctness: 5,
        safety: 5,
        hallucination_risk: 5,
        clarity: 4,
        conciseness: 3,
        actionability: 4,
        tone: 3,
        workflow_fit: 3,
      }),
    ).toBe(4.7);
  });

  test("flags missed allergy as a critical low score", () => {
    const evaluationCase = meditagEvaluationCases.find(
      (item) => item.id === "demo-conflict-amoxicillin-allergy-fail",
    );
    expect(evaluationCase).toBeDefined();

    const score = automatedScore(evaluationCase!, "This medication is ready after normal checks.");

    expect(score.flags).toContain("missed_allergy");
    expect(score.weightedFinalScore).toBeLessThanOrEqual(2);
  });

  test("rewards concise action-oriented allergy explanation", () => {
    const evaluationCase = meditagEvaluationCases.find(
      (item) => item.id === "demo-conflict-amoxicillin-allergy-fail",
    );
    expect(evaluationCase).toBeDefined();

    const score = automatedScore(
      evaluationCase!,
      "Do not administer amoxicillin. MediTag found a conflict with the patient's recorded penicillin allergy; verify the order and contact pharmacy or the ordering clinician.",
    );

    expect(score.flags).not.toContain("missed_allergy");
    expect(score.scores.clinical_correctness).toBe(5);
    expect(score.scores.actionability).toBeGreaterThanOrEqual(4);
  });

  test("flags invented patient details in bounded production prompt context", () => {
    const evaluationCase = meditagEvaluationCases.find(
      (item) => item.id === "demo-conflict-wristband-amoxicillin-limited-context",
    );
    expect(evaluationCase).toBeDefined();

    const score = automatedScore(
      evaluationCase!,
      "Demo Conflict Patient has a **Penicillin allergy**, so Amoxicillin 500mg conflicts with the record.",
    );

    expect(score.flags).toContain("invented_patient_data");
    expect(score.scores.hallucination_risk).toBe(1);
  });
});
