import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const aiProviderSchema = z.enum(["openai", "anthropic"]);
const optionalApiKeySchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}, z.string().trim().min(1).optional());
const aiEnvironmentSchema = z
  .object({
    AI_PROVIDER: aiProviderSchema,
    AI_MODEL: z.string().trim().min(1, "AI_MODEL is required."),
    OPENAI_API_KEY: optionalApiKeySchema,
    ANTHROPIC_API_KEY: optionalApiKeySchema,
  })
  .superRefine((environment, ctx) => {
    if (environment.AI_PROVIDER === "openai" && !environment.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required when AI_PROVIDER is openai.",
        path: ["OPENAI_API_KEY"],
      });
    }

    if (environment.AI_PROVIDER === "anthropic" && !environment.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ANTHROPIC_API_KEY is required when AI_PROVIDER is anthropic.",
        path: ["ANTHROPIC_API_KEY"],
      });
    }
  });

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type AiConfig = {
  provider: AiProvider;
  model: string;
};

export type AiDebugSnapshot = {
  rawProvider: string | null;
  rawModel: string | null;
  hasOpenAiKey: boolean;
  hasAnthropicKey: boolean;
};

type AiEnvironment = {
  AI_PROVIDER?: string | undefined;
  AI_MODEL?: string | undefined;
  OPENAI_API_KEY?: string | undefined;
  ANTHROPIC_API_KEY?: string | undefined;
};

function parseAiEnvironment(environment?: AiEnvironment) {
  return aiEnvironmentSchema.parse(environment ?? (process.env as AiEnvironment));
}

function normalizeOptionalString(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getAiDebugSnapshot(environment?: AiEnvironment): AiDebugSnapshot {
  const source = environment ?? (process.env as AiEnvironment);

  return {
    rawProvider: normalizeOptionalString(source.AI_PROVIDER),
    rawModel: normalizeOptionalString(source.AI_MODEL),
    hasOpenAiKey: normalizeOptionalString(source.OPENAI_API_KEY) !== null,
    hasAnthropicKey: normalizeOptionalString(source.ANTHROPIC_API_KEY) !== null,
  };
}

export function getAiConfig(environment?: AiEnvironment): AiConfig {
  const parsed = parseAiEnvironment(environment);

  return {
    provider: parsed.AI_PROVIDER,
    model: parsed.AI_MODEL,
  };
}

export function getAiTextModel(environment?: AiEnvironment) {
  const parsed = parseAiEnvironment(environment);
  const config = {
    provider: parsed.AI_PROVIDER,
    model: parsed.AI_MODEL,
  } satisfies AiConfig;

  switch (config.provider) {
    case "openai":
      return {
        config,
        model: createOpenAI({ apiKey: parsed.OPENAI_API_KEY })(config.model),
      };
    case "anthropic":
      return {
        config,
        model: createAnthropic({ apiKey: parsed.ANTHROPIC_API_KEY })(config.model),
      };
  }
}
