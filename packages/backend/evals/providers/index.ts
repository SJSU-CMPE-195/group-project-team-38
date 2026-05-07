import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { EvaluationProviderName, ProviderRequest, ProviderResponse } from "../types";

export type ProviderAdapter = {
  generate(request: ProviderRequest): Promise<ProviderResponse>;
};

const openRouterProviderPrefixes: Record<EvaluationProviderName, string> = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "google",
};

function getOpenRouterApiKey() {
  const apiKey = process.env.OPEN_ROUTER_API_KEY?.trim();
  return apiKey || undefined;
}

function getOpenRouterModelId(request: ProviderRequest) {
  const model = request.model.model.trim();
  if (model.includes("/")) {
    return model;
  }

  return `${openRouterProviderPrefixes[request.model.provider]}/${model}`;
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export const openRouterAdapter: ProviderAdapter = {
  async generate(request) {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error("OPEN_ROUTER_API_KEY is required for evals.");
    }

    const openRouterModel = getOpenRouterModelId(request);
    const reasoningEffort = request.model.reasoningEffort ?? "none";
    const openrouter = createOpenRouter({
      apiKey,
      appName: "MediTag LLM Evals",
      appUrl: "https://github.com/jonathannguyen/group-project-team-38",
      compatibility: "strict",
    });

    const result = await generateText({
      model: openrouter.chat(openRouterModel, {
        reasoning: {
          effort: reasoningEffort,
          exclude: true,
        },
        includeReasoning: false,
        usage: {
          include: true,
        },
      }),
      system: request.systemPrompt,
      prompt: request.userPrompt,
      maxOutputTokens: request.model.maxOutputTokens ?? 180,
      temperature: request.model.temperature,
    });

    return {
      rawText: result.text,
      normalizedText: normalizeText(result.text),
      metadata: {
        id: result.response.id,
        model: result.response.modelId,
        requestedModel: openRouterModel,
        reasoningEffort,
        includeReasoning: false,
        finishReason: result.finishReason,
        rawFinishReason: result.rawFinishReason,
        warnings: result.warnings,
        providerMetadata: result.providerMetadata,
        usage: result.usage,
      },
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
      },
    };
  },
};

export function getProviderAdapter(_provider: ProviderRequest["model"]["provider"]) {
  return openRouterAdapter;
}
