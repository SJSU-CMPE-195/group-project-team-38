import type { ProviderRequest, ProviderResponse } from "../types";

export type ProviderAdapter = {
  generate(request: ProviderRequest): Promise<ProviderResponse>;
};

function getEnvApiKey(primaryName: string, fallbackName?: string) {
  const primaryValue = process.env[primaryName]?.trim();
  if (primaryValue) {
    return primaryValue;
  }

  if (!fallbackName) {
    return undefined;
  }

  const fallbackValue = process.env[fallbackName]?.trim();
  return fallbackValue || undefined;
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function postJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const bodyText = await response.text();
  let body: unknown;

  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { rawBody: bodyText };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body as Record<string, unknown>;
}

export const openAiAdapter: ProviderAdapter = {
  async generate(request) {
    const apiKey = getEnvApiKey("OPEN_API_KEY", "OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPEN_API_KEY or OPENAI_API_KEY is required for OpenAI evals.");
    }

    const body = await postJson("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model.model,
        input: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        max_output_tokens: request.model.maxOutputTokens ?? 180,
        temperature: request.model.temperature ?? 0.1,
      }),
    });

    const outputText =
      typeof body.output_text === "string"
        ? body.output_text
        : Array.isArray(body.output)
          ? body.output
              .flatMap((item) =>
                typeof item === "object" &&
                item !== null &&
                "content" in item &&
                Array.isArray(item.content)
                  ? item.content
                  : [],
              )
              .map((content) =>
                typeof content === "object" && content !== null && "text" in content
                  ? String(content.text)
                  : "",
              )
              .join(" ")
          : "";

    return {
      rawText: outputText,
      normalizedText: normalizeText(outputText),
      metadata: { id: body.id, status: body.status, usage: body.usage },
      usage:
        typeof body.usage === "object" && body.usage !== null
          ? {
              inputTokens:
                Number((body.usage as { input_tokens?: unknown }).input_tokens) || undefined,
              outputTokens:
                Number((body.usage as { output_tokens?: unknown }).output_tokens) || undefined,
              totalTokens:
                Number((body.usage as { total_tokens?: unknown }).total_tokens) || undefined,
            }
          : undefined,
    };
  },
};

export const anthropicAdapter: ProviderAdapter = {
  async generate(request) {
    const apiKey = getEnvApiKey("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required for Anthropic evals.");
    }

    const body = await postJson("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model.model,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        max_tokens: request.model.maxOutputTokens ?? 180,
        temperature: request.model.temperature ?? 0.1,
      }),
    });

    const outputText = Array.isArray(body.content)
      ? body.content
          .map((content) =>
            typeof content === "object" && content !== null && "text" in content
              ? String(content.text)
              : "",
          )
          .join(" ")
      : "";

    return {
      rawText: outputText,
      normalizedText: normalizeText(outputText),
      metadata: { id: body.id, stopReason: body.stop_reason, usage: body.usage },
      usage:
        typeof body.usage === "object" && body.usage !== null
          ? {
              inputTokens:
                Number((body.usage as { input_tokens?: unknown }).input_tokens) || undefined,
              outputTokens:
                Number((body.usage as { output_tokens?: unknown }).output_tokens) || undefined,
            }
          : undefined,
    };
  },
};

export const geminiAdapter: ProviderAdapter = {
  async generate(request) {
    const apiKey = getEnvApiKey("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for Gemini evals.");
    }

    const body = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        request.model.model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
          generationConfig: {
            maxOutputTokens: request.model.maxOutputTokens ?? 180,
            temperature: request.model.temperature ?? 0.1,
          },
        }),
      },
    );

    const outputText = Array.isArray(body.candidates)
      ? body.candidates
          .flatMap((candidate) =>
            typeof candidate === "object" &&
            candidate !== null &&
            "content" in candidate &&
            typeof candidate.content === "object" &&
            candidate.content !== null &&
            "parts" in candidate.content &&
            Array.isArray(candidate.content.parts)
              ? candidate.content.parts
              : [],
          )
          .map((part) =>
            typeof part === "object" && part !== null && "text" in part ? String(part.text) : "",
          )
          .join(" ")
      : "";

    return {
      rawText: outputText,
      normalizedText: normalizeText(outputText),
      metadata: { usageMetadata: body.usageMetadata, promptFeedback: body.promptFeedback },
      usage:
        typeof body.usageMetadata === "object" && body.usageMetadata !== null
          ? {
              inputTokens:
                Number((body.usageMetadata as { promptTokenCount?: unknown }).promptTokenCount) ||
                undefined,
              outputTokens:
                Number(
                  (body.usageMetadata as { candidatesTokenCount?: unknown }).candidatesTokenCount,
                ) || undefined,
              totalTokens:
                Number((body.usageMetadata as { totalTokenCount?: unknown }).totalTokenCount) ||
                undefined,
            }
          : undefined,
    };
  },
};

export function getProviderAdapter(provider: ProviderRequest["model"]["provider"]) {
  switch (provider) {
    case "openai":
      return openAiAdapter;
    case "anthropic":
      return anthropicAdapter;
    case "gemini":
      return geminiAdapter;
  }
}
