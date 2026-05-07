import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotEnv } from "dotenv";
import { meditagEvaluationCases } from "./cases/meditagCases";
import { nurseExplanationPrompt } from "./prompts/nurseExplanationPrompt";
import { defaultRunConfig } from "./providers/config";
import { getProviderAdapter } from "./providers";
import { automatedScore } from "./scoring/rubric";
import {
  generateCsvResults,
  generateMarkdownReport,
  summarizeResults,
} from "./reports/generateReport";
import type { EvalRunConfig, EvaluationResult, ModelConfig, ProviderResponse } from "./types";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(backendDir, ".env.local");

loadDotEnv({ path: envPath });

function parseArgs(args: string[]) {
  const parsed: Record<string, string | boolean> = {};
  for (const arg of args) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [key, value] = arg.slice(2).split("=", 2);
    if (!key) {
      continue;
    }

    parsed[key] = value ?? true;
  }

  return parsed;
}

async function readJsonConfig(
  configPath?: string,
): Promise<Partial<EvalRunConfig> & { models?: ModelConfig[] }> {
  if (!configPath) {
    return {};
  }

  const absolutePath = path.resolve(process.cwd(), configPath);
  return JSON.parse(await readFile(absolutePath, "utf8")) as Partial<EvalRunConfig> & {
    models?: ModelConfig[];
  };
}

function createRunConfig(
  overrides: Partial<EvalRunConfig>,
  args: Record<string, string | boolean>,
): EvalRunConfig {
  const providerArg = typeof args.providers === "string" ? args.providers.split(",") : undefined;
  const categoryArg = typeof args.categories === "string" ? args.categories.split(",") : undefined;
  const modelArg = typeof args.models === "string" ? args.models.split(",") : undefined;
  const smokeTest = args.smoke === true || overrides.smokeTest === true;

  const providers = providerArg
    ? (providerArg as EvalRunConfig["providers"])
    : (overrides.providers ?? defaultRunConfig.providers);
  let models = overrides.models ?? defaultRunConfig.models;

  if (modelArg) {
    models = models.map((model) => ({
      ...model,
      enabled:
        modelArg.includes(`${model.provider}/${model.model}`) || modelArg.includes(model.model),
    }));
  }

  return {
    ...defaultRunConfig,
    ...overrides,
    providers,
    models,
    caseCategories: categoryArg as EvalRunConfig["caseCategories"],
    smokeTest,
    outputDir:
      typeof args.outputDir === "string"
        ? args.outputDir
        : (overrides.outputDir ?? defaultRunConfig.outputDir),
    runName:
      typeof args.runName === "string"
        ? args.runName
        : (overrides.runName ?? defaultRunConfig.runName),
  };
}

function selectCases(config: EvalRunConfig) {
  let cases = meditagEvaluationCases;

  if (config.caseCategories?.length) {
    cases = cases.filter((evaluationCase) =>
      config.caseCategories?.includes(evaluationCase.category),
    );
  }

  if (config.caseIds?.length) {
    cases = cases.filter((evaluationCase) => config.caseIds?.includes(evaluationCase.id));
  }

  return config.smokeTest ? cases.slice(0, 1) : cases;
}

function selectModels(config: EvalRunConfig) {
  const models = config.models.filter(
    (model) => model.enabled && config.providers.includes(model.provider),
  );
  if (config.smokeTest) {
    const seen = new Set<string>();
    return models.filter((model) => {
      if (seen.has(model.provider)) {
        return false;
      }

      seen.add(model.provider);
      return true;
    });
  }

  return models;
}

function estimateCost(model: ModelConfig, response?: ProviderResponse) {
  if (!response?.usage) {
    return undefined;
  }

  const inputCost = model.inputCostPerMillionTokens
    ? ((response.usage.inputTokens ?? 0) / 1_000_000) * model.inputCostPerMillionTokens
    : 0;
  const outputCost = model.outputCostPerMillionTokens
    ? ((response.usage.outputTokens ?? 0) / 1_000_000) * model.outputCostPerMillionTokens
    : 0;
  const total = inputCost + outputCost;

  return total > 0 ? Number(total.toFixed(6)) : undefined;
}

async function runOne(model: ModelConfig, evaluationCase: (typeof meditagEvaluationCases)[number]) {
  const started = Date.now();
  let providerResponse: ProviderResponse | undefined;
  let providerError: string | undefined;

  try {
    providerResponse = await getProviderAdapter(model.provider).generate({
      model,
      systemPrompt: nurseExplanationPrompt.system,
      userPrompt: nurseExplanationPrompt.renderUserPrompt(evaluationCase),
    });
  } catch (error) {
    providerError = error instanceof Error ? error.message : String(error);
  }

  const normalizedExplanationText = providerResponse?.normalizedText ?? "";
  const result: EvaluationResult = {
    provider: model.provider,
    model: model.model,
    caseId: evaluationCase.id,
    caseCategory: evaluationCase.category,
    promptVersion: nurseExplanationPrompt.version,
    rawResponseText: providerResponse?.rawText ?? "",
    normalizedExplanationText,
    runtimeMetadata: providerResponse?.metadata ?? {},
    latencyMs: Date.now() - started,
    providerError,
    timestamp: new Date().toISOString(),
    automatedScore: automatedScore(evaluationCase, normalizedExplanationText, providerError),
    estimatedCostUsd: estimateCost(model, providerResponse),
  };

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = typeof args.config === "string" ? args.config : undefined;
  const config = createRunConfig(await readJsonConfig(configPath), args);
  const cases = selectCases(config);
  const models = selectModels(config);
  const outputDir = path.resolve(backendDir, config.outputDir);
  const runId = `${config.runName}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const runOutputDir = path.join(outputDir, runId);
  const results: EvaluationResult[] = [];

  await mkdir(runOutputDir, { recursive: true });

  for (const evaluationCase of cases) {
    for (const model of models) {
      const result = await runOne(model, evaluationCase);
      results.push(result);
      console.log(
        `${result.provider}/${result.model} ${result.caseId}: ${result.automatedScore?.weightedFinalScore ?? "n/a"}`,
      );
    }
  }

  const summary = summarizeResults(config.runName, results);

  await writeFile(path.join(runOutputDir, "results.json"), JSON.stringify(results, null, 2));
  await writeFile(path.join(runOutputDir, "summary.json"), JSON.stringify(summary, null, 2));
  await writeFile(path.join(runOutputDir, "results.csv"), generateCsvResults(results));

  if (config.generateMarkdownReport) {
    await writeFile(path.join(runOutputDir, "report.md"), generateMarkdownReport(summary, results));
  }

  console.log(`Wrote eval artifacts to ${runOutputDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
