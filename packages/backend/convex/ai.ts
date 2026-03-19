import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const aiProviderSchema = z.enum(["openai", "anthropic"]);
const aiEnvironmentSchema = z
  .object({
    AI_PROVIDER: aiProviderSchema,
    AI_MODEL: z.string().trim().min(1, "AI_MODEL is required."),
    OPENAI_API_KEY: z.string().trim().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
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

type AiEnvironment = {
  AI_PROVIDER: string | undefined;
  AI_MODEL: string | undefined;
  OPENAI_API_KEY: string | undefined;
  ANTHROPIC_API_KEY: string | undefined;
};

function parseAiEnvironment(environment: AiEnvironment = process.env) {
  return aiEnvironmentSchema.parse(environment);
}

export function getAiConfig(environment: AiEnvironment = process.env): AiConfig {
  const parsed = parseAiEnvironment(environment);

  return {
    provider: parsed.AI_PROVIDER,
    model: parsed.AI_MODEL,
  };
}

export function getAiTextModel(environment: AiEnvironment = process.env) {
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
