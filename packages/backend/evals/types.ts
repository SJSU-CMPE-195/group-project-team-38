export type EvaluationProviderName = "openai" | "anthropic" | "gemini";

export type VerificationResult = "safe_match" | "warning" | "blocked" | "incomplete";

export type EvaluationCase = {
  id: string;
  title: string;
  category:
    | "allergy_conflict"
    | "wrong_patient"
    | "dosage_warning"
    | "contraindication"
    | "safe_match"
    | "missing_patient_data"
    | "missing_medication_data"
    | "ambiguous_scan"
    | "high_risk_medication"
    | "normal_low_risk_scan";
  patientContext: Record<string, unknown>;
  medicationContext: Record<string, unknown>;
  scanContext: Record<string, unknown>;
  verificationResult: VerificationResult;
  knownExpectedIssue: string;
  expectedExplanationBehavior: string[];
  safetyConstraints: string[];
  tags: string[];
};

export type PromptTemplate = {
  version: string;
  system: string;
  renderUserPrompt: (evaluationCase: EvaluationCase) => string;
};

export type ModelConfig = {
  provider: EvaluationProviderName;
  model: string;
  enabled: boolean;
  maxOutputTokens?: number;
  temperature?: number;
  inputCostPerMillionTokens?: number;
  outputCostPerMillionTokens?: number;
};

export type EvalRunConfig = {
  runName: string;
  providers: EvaluationProviderName[];
  models: ModelConfig[];
  caseCategories?: EvaluationCase["category"][];
  caseIds?: string[];
  saveRawOutputs: boolean;
  automatedScoring: boolean;
  generateMarkdownReport: boolean;
  includeCostAndLatency: boolean;
  smokeTest: boolean;
  outputDir: string;
};

export type ProviderRequest = {
  model: ModelConfig;
  systemPrompt: string;
  userPrompt: string;
};

export type ProviderResponse = {
  rawText: string;
  normalizedText: string;
  metadata: Record<string, unknown>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export type ScoreDimension =
  | "clinical_correctness"
  | "safety"
  | "hallucination_risk"
  | "clarity"
  | "conciseness"
  | "actionability"
  | "tone"
  | "workflow_fit";

export type Scores = Record<ScoreDimension, number>;

export type SafetyFlag =
  | "missed_allergy"
  | "missed_wrong_patient"
  | "invented_patient_data"
  | "invented_medication_fact"
  | "unsafe_medical_advice"
  | "too_verbose_for_bedside_use"
  | "failed_to_explain_warning"
  | "overconfident_diagnosis"
  | "provider_error"
  | "empty_response";

export type AutomatedScore = {
  scores: Scores;
  weightedFinalScore: number;
  flags: SafetyFlag[];
  notes: string[];
};

export type HumanReview = {
  reviewer?: string;
  manualScoreOverrides?: Partial<Scores>;
  notes?: string;
  safetyConcerns?: string[];
  finalRecommendation?: string;
};

export type EvaluationResult = {
  provider: EvaluationProviderName;
  model: string;
  caseId: string;
  caseCategory: EvaluationCase["category"];
  promptVersion: string;
  rawResponseText: string;
  normalizedExplanationText: string;
  runtimeMetadata: Record<string, unknown>;
  latencyMs: number;
  providerError?: string;
  timestamp: string;
  automatedScore?: AutomatedScore;
  humanReview?: HumanReview;
  estimatedCostUsd?: number;
};

export type ReportSummary = {
  runName: string;
  generatedAt: string;
  totalResults: number;
  bestOverallModel?: string;
  models: Array<{
    provider: EvaluationProviderName;
    model: string;
    averageScore: number;
    averageLatencyMs: number;
    failureRate: number;
    safetyFlagCount: number;
    hallucinationFlagCount: number;
    estimatedCostUsd?: number;
  }>;
  bestModelByCategory: Record<string, string>;
  recommendation: string;
};
