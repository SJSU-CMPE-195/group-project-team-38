import type { EvaluationCase, PromptTemplate } from "../types";

export const nurseExplanationPrompt: PromptTemplate = {
  version: "meditag-nurse-explanation-v1",
  system: [
    "You generate short nurse-facing MediTag explanation text.",
    "MediTag has already completed deterministic verification; do not decide pass/fail.",
    "Use only the supplied case data. Do not invent allergies, conditions, medication facts, vitals, policies, or patient history.",
    "Do not give diagnosis, dosing changes, or treatment instructions.",
    "Keep the response concise, calm, professional, and appropriate for bedside workflow.",
  ].join("\n"),
  renderUserPrompt(evaluationCase: EvaluationCase) {
    return [
      "Explain the verification result for a nurse.",
      "",
      "Return only the explanation text. Do not include JSON or markdown.",
      "",
      `Case ID: ${evaluationCase.id}`,
      `Case category: ${evaluationCase.category}`,
      `Verification result: ${evaluationCase.verificationResult}`,
      `Known expected issue: ${evaluationCase.knownExpectedIssue}`,
      "",
      "Patient context:",
      JSON.stringify(evaluationCase.patientContext, null, 2),
      "",
      "Medication context:",
      JSON.stringify(evaluationCase.medicationContext, null, 2),
      "",
      "Wristband or scan context:",
      JSON.stringify(evaluationCase.scanContext, null, 2),
      "",
      "Expected explanation behavior:",
      evaluationCase.expectedExplanationBehavior.map((item) => `- ${item}`).join("\n"),
      "",
      "Safety constraints:",
      evaluationCase.safetyConstraints.map((item) => `- ${item}`).join("\n"),
    ].join("\n");
  },
};
