import type { EvaluationCase, PromptTemplate } from "../types";

export const nurseExplanationPrompt: PromptTemplate = {
  version: "meditag-nurse-explanation-v2-demo-aligned",
  system: [
    "You write short, factual medication safety explanations for a prototype nurse workflow.",
    "MediTag has already completed deterministic verification; do not decide pass/fail.",
    "Use only the supplied structured verification facts. Do not invent patient details, clinical history, medication effects, treatment advice, next steps, vitals, labs, or policies.",
    "Keep the explanation to at most 3 sentences and under 90 words.",
    "Use simple Markdown only when helpful: bold the most important clinical term with **double asterisks**.",
    "Do not use headings, links, code, or tables.",
  ].join("\n"),
  renderUserPrompt(evaluationCase: EvaluationCase) {
    return [
      "Explain the verification result for a nurse.",
      "",
      "Return only the explanation text.",
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
