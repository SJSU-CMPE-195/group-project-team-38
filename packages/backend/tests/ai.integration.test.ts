import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateText } from "ai";
import { describe, expect, test } from "vitest";

import { getAiTextModel } from "../convex/ai";
import {
  buildScanLogExplanationPrompt,
  normalizeExplanationText,
} from "../convex/scanLogExplanations";

const currentDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(currentDir, "../.env.local") });

const hasLiveAnthropicConfig =
  process.env.AI_PROVIDER === "anthropic" &&
  typeof process.env.AI_MODEL === "string" &&
  process.env.AI_MODEL.trim().length > 0 &&
  typeof process.env.ANTHROPIC_API_KEY === "string" &&
  process.env.ANTHROPIC_API_KEY.trim().length > 0;

describe("live Anthropic AI integration", () => {
  test.runIf(hasLiveAnthropicConfig)(
    "generates a real explanation from the configured Anthropic model using the production prompt builder",
    async () => {
      const { model, config } = getAiTextModel();
      const prompt = buildScanLogExplanationPrompt({
        failureReasons: ["allergy_conflict"],
        patientAllergyLabels: ["Penicillin allergy"],
        medication: {
          displayName: "Amoxicillin 500mg",
          rxNormCode: "723",
          route: "PO",
          dose: "1 tablet",
          frequency: "BID",
        },
      });

      const result = await generateText({
        model,
        system: prompt.system,
        prompt: prompt.prompt,
        temperature: 0,
        maxOutputTokens: 160,
      });

      const explanationText = normalizeExplanationText(result.text);

      expect(config.provider).toBe("anthropic");
      expect(config.model).toBe(process.env.AI_MODEL);
      expect(explanationText.length).toBeGreaterThan(0);
      expect(explanationText.length).toBeLessThanOrEqual(500);
      expect(explanationText).not.toContain("Demo Conflict Patient");
      expect(explanationText).not.toContain("MRN-CONFLICT-001");
      expect(explanationText).not.toContain("WRISTBAND-CONFLICT-QR-001");
      expect(explanationText).toMatch(/allerg|conflict|risk/i);
    },
    120_000,
  );
});
