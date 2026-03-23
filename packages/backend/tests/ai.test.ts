import { describe, expect, test } from "vitest";

import { getAiConfig, getAiTextModel } from "../convex/ai";

describe("AI backend config", () => {
  test("returns the configured OpenAI provider and model", () => {
    expect(
      getAiConfig({
        AI_PROVIDER: "openai",
        AI_MODEL: "gpt-4o-mini",
        OPENAI_API_KEY: "test-openai-key",
        ANTHROPIC_API_KEY: undefined,
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
    });
  });

  test("returns the configured Anthropic provider and model", () => {
    expect(
      getAiConfig({
        AI_PROVIDER: "anthropic",
        AI_MODEL: "claude-sonnet-4-5",
        OPENAI_API_KEY: undefined,
        ANTHROPIC_API_KEY: "test-anthropic-key",
      }),
    ).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });
  });

  test("requires the selected provider API key", () => {
    expect(() =>
      getAiConfig({
        AI_PROVIDER: "openai",
        AI_MODEL: "gpt-4o-mini",
        OPENAI_API_KEY: undefined,
        ANTHROPIC_API_KEY: undefined,
      }),
    ).toThrow("OPENAI_API_KEY is required when AI_PROVIDER is openai.");

    expect(() =>
      getAiConfig({
        AI_PROVIDER: "anthropic",
        AI_MODEL: "claude-sonnet-4-5",
        OPENAI_API_KEY: undefined,
        ANTHROPIC_API_KEY: undefined,
      }),
    ).toThrow("ANTHROPIC_API_KEY is required when AI_PROVIDER is anthropic.");
  });

  test("ignores blank API keys for the provider that is not selected", () => {
    expect(
      getAiConfig({
        AI_PROVIDER: "anthropic",
        AI_MODEL: "claude-sonnet-4-5",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "test-anthropic-key",
      }),
    ).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });

    expect(
      getAiConfig({
        AI_PROVIDER: "openai",
        AI_MODEL: "gpt-4o-mini",
        OPENAI_API_KEY: "test-openai-key",
        ANTHROPIC_API_KEY: "   ",
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
    });
  });

  test("builds the selected text model through one server-side selection path", () => {
    const openai = getAiTextModel({
      AI_PROVIDER: "openai",
      AI_MODEL: "gpt-4o-mini",
      OPENAI_API_KEY: "test-openai-key",
      ANTHROPIC_API_KEY: undefined,
    });
    expect(openai.config).toEqual({ provider: "openai", model: "gpt-4o-mini" });
    expect(openai.model.modelId).toBe("gpt-4o-mini");
    expect(openai.model.provider).toBe("openai.responses");

    const anthropic = getAiTextModel({
      AI_PROVIDER: "anthropic",
      AI_MODEL: "claude-sonnet-4-5",
      OPENAI_API_KEY: undefined,
      ANTHROPIC_API_KEY: "test-anthropic-key",
    });
    expect(anthropic.config).toEqual({ provider: "anthropic", model: "claude-sonnet-4-5" });
    expect(anthropic.model.modelId).toBe("claude-sonnet-4-5");
    expect(anthropic.model.provider).toBe("anthropic.messages");
  });
});
