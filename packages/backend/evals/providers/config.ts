import type { EvalRunConfig, ModelConfig } from "../types";

export const defaultModelConfigs: ModelConfig[] = [
  {
    provider: "openai",
    model: "gpt-4o-mini",
    enabled: true,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
  {
    provider: "openai",
    model: "gpt-4o",
    enabled: false,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    enabled: true,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    enabled: false,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
  {
    provider: "gemini",
    model: "gemini-2.5-flash",
    enabled: true,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
  {
    provider: "gemini",
    model: "gemini-2.5-pro",
    enabled: false,
    maxOutputTokens: 180,
    temperature: 0.1,
  },
];

export const defaultRunConfig: EvalRunConfig = {
  runName: "meditag-llm-eval",
  providers: ["openai", "anthropic", "gemini"],
  models: defaultModelConfigs,
  saveRawOutputs: true,
  automatedScoring: true,
  generateMarkdownReport: true,
  includeCostAndLatency: true,
  smokeTest: false,
  outputDir: "evals/results",
};
