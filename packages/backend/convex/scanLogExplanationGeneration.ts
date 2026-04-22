"use node";

import { streamText } from "ai";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getAiConfig, getAiDebugSnapshot, getAiTextModel } from "./ai";
import { buildScanLogExplanationPrompt, normalizeExplanationText } from "./scanLogExplanations";

const STREAM_PATCH_INTERVAL_MS = 150;

type StructuredErrorIssue = {
  path?: string[];
  message?: string;
};

function parseStructuredErrorMessage(errorMessage: string) {
  try {
    const parsed = JSON.parse(errorMessage) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    const [firstIssue] = parsed as StructuredErrorIssue[];
    if (!firstIssue?.message) {
      return null;
    }

    const issuePath =
      Array.isArray(firstIssue.path) && firstIssue.path.length > 0
        ? `${firstIssue.path.join(".")}: `
        : "";

    return `${issuePath}${firstIssue.message}`;
  } catch {
    return null;
  }
}

function getGenerationFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return (parseStructuredErrorMessage(error.message.trim()) ?? error.message.trim()).slice(
      0,
      500,
    );
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim().slice(0, 500);
  }

  return "Explanation generation failed.";
}

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
    const aiDebugSnapshot = getAiDebugSnapshot();

    try {
      const { config, model } = getAiTextModel();
      explanationModel = config.model;
      console.info("[scanLogExplanationGeneration] Starting AI explanation generation", {
        scanLogId: args.scanLogId,
        provider: config.provider,
        model: config.model,
        aiDebugSnapshot,
      });
      const { system, prompt } = buildScanLogExplanationPrompt(context.promptInput);
      const result = streamText({
        model,
        system,
        prompt,
        temperature: 0,
        maxOutputTokens: 160,
      });

      let accumulated = "";
      let lastPatchAt = 0;
      let lastPatchedText = "";

      for await (const delta of result.textStream) {
        accumulated += delta;
        const now = Date.now();
        if (now - lastPatchAt < STREAM_PATCH_INTERVAL_MS) {
          continue;
        }
        const normalized = normalizeExplanationText(accumulated);
        if (normalized.length === 0 || normalized === lastPatchedText) {
          continue;
        }
        await ctx.runMutation(internal.scanLogExplanations.streamScanLogExplanationText, {
          scanLogId: args.scanLogId,
          explanationText: normalized,
        });
        lastPatchAt = now;
        lastPatchedText = normalized;
      }

      const explanationText = normalizeExplanationText(accumulated);

      if (explanationText.length === 0) {
        throw new Error("AI explanation was empty.");
      }

      await ctx.runMutation(internal.scanLogExplanations.patchScanLogExplanation, {
        scanLogId: args.scanLogId,
        explanationStatus: "generated",
        explanationText,
        explanationModel,
      });

      console.info("[scanLogExplanationGeneration] AI explanation generated", {
        scanLogId: args.scanLogId,
        provider: config.provider,
        model: explanationModel,
      });

      return { status: "generated" as const };
    } catch (error) {
      if (!explanationModel) {
        try {
          explanationModel = getAiConfig().model;
        } catch {
          explanationModel = undefined;
        }
      }

      console.error("[scanLogExplanationGeneration] AI explanation generation failed", {
        scanLogId: args.scanLogId,
        explanationModel,
        aiDebugSnapshot,
        failureMessage: getGenerationFailureMessage(error),
      });

      await ctx.runMutation(internal.scanLogExplanations.patchScanLogExplanation, {
        scanLogId: args.scanLogId,
        explanationStatus: "failed",
        explanationText: getGenerationFailureMessage(error),
        explanationModel,
      });

      return { status: "failed" as const };
    }
  },
});
