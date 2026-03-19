"use node";

import { generateText } from "ai";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getAiConfig, getAiTextModel } from "./ai";
import { buildScanLogExplanationPrompt, normalizeExplanationText } from "./scanLogExplanations";

export const generateForScanLog = internalAction({
  args: {
    scanLogId: v.id("scanLogs"),
  },
  returns: v.object({
    status: v.union(v.literal("generated"), v.literal("failed"), v.literal("skipped")),
  }),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.scanLogExplanations.loadScanLogExplanationContext, {
      scanLogId: args.scanLogId,
    });

    if (context.status === "skipped") {
      return { status: "skipped" as const };
    }

    let explanationModel: string | undefined;

    try {
      const { config, model } = getAiTextModel();
      explanationModel = config.model;
      const { system, prompt } = buildScanLogExplanationPrompt(context.promptInput);
      const result = await generateText({
        model,
        system,
        prompt,
        temperature: 0,
        maxOutputTokens: 160,
      });
      const explanationText = normalizeExplanationText(result.text);

      if (explanationText.length === 0) {
        throw new Error("AI explanation was empty.");
      }

      await ctx.runMutation(internal.scanLogExplanations.patchScanLogExplanation, {
        scanLogId: args.scanLogId,
        explanationStatus: "generated",
        explanationText,
        explanationModel,
      });

      return { status: "generated" as const };
    } catch {
      if (!explanationModel) {
        try {
          explanationModel = getAiConfig().model;
        } catch {
          explanationModel = undefined;
        }
      }

      await ctx.runMutation(internal.scanLogExplanations.patchScanLogExplanation, {
        scanLogId: args.scanLogId,
        explanationStatus: "failed",
        explanationText: undefined,
        explanationModel,
      });

      return { status: "failed" as const };
    }
  },
});
