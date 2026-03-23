import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { requireAuthUser, requireRole } from "./authz";

const failureReasonValidator = v.union(
  v.literal("identity_mismatch"),
  v.literal("allergy_conflict"),
  v.literal("wristband_not_found"),
  v.literal("medication_not_found"),
);

const boundedMedicationValidator = v.object({
  displayName: v.string(),
  rxNormCode: v.string(),
  route: v.optional(v.string()),
  dose: v.optional(v.string()),
  frequency: v.optional(v.string()),
});

const explanationPromptInputValidator = v.object({
  failureReasons: v.array(failureReasonValidator),
  patientAllergyLabels: v.array(v.string()),
  medication: v.optional(boundedMedicationValidator),
});

const loadExplanationContextResultValidator = v.union(
  v.object({
    status: v.literal("eligible"),
    promptInput: explanationPromptInputValidator,
  }),
  v.object({
    status: v.literal("skipped"),
    reason: v.union(
      v.literal("scan_log_missing"),
      v.literal("scan_passed"),
      v.literal("not_requested"),
      v.literal("already_processed"),
    ),
  }),
);

type FailureReason = Doc<"scanLogs">["failureReasons"][number];

type ExplanationPromptInput = {
  failureReasons: FailureReason[];
  patientAllergyLabels: string[];
  medication?: {
    displayName: string;
    rxNormCode: string;
    route?: string;
    dose?: string;
    frequency?: string;
  };
};

function buildReasonGuidance(failureReasons: FailureReason[]) {
  return failureReasons.map((reason) => {
    switch (reason) {
      case "allergy_conflict":
        return "If there is an allergy conflict, explain that the medication conflicts with a recorded patient allergy and stay grounded in the provided allergy labels only.";
      case "identity_mismatch":
        return "If there is an identity mismatch, explain that the selected medication belongs to a different patient record than the scanned wristband.";
      case "wristband_not_found":
        return "If the wristband was not found, explain that the scanned token could not be matched to an active wristband record.";
      case "medication_not_found":
        return "If the medication was not found, keep the explanation generic because the current schema does not include enough stored context for a more specific explanation.";
    }
  });
}

export function buildScanLogExplanationPrompt(input: ExplanationPromptInput) {
  const system =
    "You write short, factual medication safety explanations for a prototype nurse workflow. Use only the structured verification facts provided. Do not invent patient details, clinical history, medication effects, treatment advice, or next steps. Keep the explanation to at most 3 sentences and under 90 words.";

  const prompt = [
    "Structured verification facts:",
    JSON.stringify(input, null, 2),
    "",
    "Required guidance:",
    ...buildReasonGuidance(input.failureReasons).map((line) => `- ${line}`),
    "- Mention only the failed checks that are present in the structured facts.",
    "- If the structured facts are limited, say that the stored verification context is limited rather than guessing.",
    "",
    "Write the nurse-facing explanation.",
  ].join("\n");

  return { system, prompt };
}

export function normalizeExplanationText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

function toBoundedMedication(medication: Doc<"medications"> | null) {
  if (!medication) {
    return undefined;
  }

  return {
    displayName: medication.displayName,
    rxNormCode: medication.rxNormCode,
    route: medication.route,
    dose: medication.dose,
    frequency: medication.frequency,
  };
}

export const loadScanLogExplanationContext = internalQuery({
  args: {
    scanLogId: v.id("scanLogs"),
  },
  returns: loadExplanationContextResultValidator,
  handler: async (ctx, args) => {
    const scanLog = await ctx.db.get(args.scanLogId);
    if (!scanLog) {
      return {
        status: "skipped" as const,
        reason: "scan_log_missing" as const,
      };
    }

    if (scanLog.result !== "fail") {
      return {
        status: "skipped" as const,
        reason: "scan_passed" as const,
      };
    }

    if (scanLog.explanationStatus === "generated" || scanLog.explanationStatus === "failed") {
      return {
        status: "skipped" as const,
        reason: "already_processed" as const,
      };
    }

    if (scanLog.explanationStatus !== "requested") {
      return {
        status: "skipped" as const,
        reason: "not_requested" as const,
      };
    }

    const patient = scanLog.patientId ? await ctx.db.get(scanLog.patientId) : null;
    const medication = scanLog.medicationId ? await ctx.db.get(scanLog.medicationId) : null;

    return {
      status: "eligible" as const,
      promptInput: {
        failureReasons: scanLog.failureReasons,
        patientAllergyLabels: patient?.allergyLabels ?? [],
        medication: toBoundedMedication(medication),
      },
    };
  },
});

export const requestScanLogExplanation = mutation({
  args: {
    scanLogId: v.id("scanLogs"),
  },
  returns: v.object({
    scanLogId: v.id("scanLogs"),
    explanationStatus: v.union(
      v.literal("none"),
      v.literal("requested"),
      v.literal("generated"),
      v.literal("failed"),
    ),
  }),
  handler: async (ctx, args) => {
    const role = await requireRole(ctx, ["nurse", "admin"]);
    const authUser = await requireAuthUser(ctx);
    const scanLog = await ctx.db.get(args.scanLogId);

    if (!scanLog) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Scan log not found.",
      });
    }

    if (role !== "admin" && scanLog.authUserId !== authUser._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You are not authorized for this scan log.",
      });
    }

    if (scanLog.result !== "fail") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Only failed scan logs can request an explanation.",
      });
    }

    if (scanLog.explanationStatus === "none" || scanLog.explanationStatus === "failed") {
      await ctx.db.patch(args.scanLogId, {
        explanationStatus: "requested",
        explanationText: undefined,
        explanationModel: undefined,
      });
      await ctx.scheduler.runAfter(0, internal.scanLogExplanationGeneration.generateForScanLog, {
        scanLogId: args.scanLogId,
      });

      return {
        scanLogId: args.scanLogId,
        explanationStatus: "requested" as const,
      };
    }

    return {
      scanLogId: args.scanLogId,
      explanationStatus: scanLog.explanationStatus,
    };
  },
});

export const patchScanLogExplanation = internalMutation({
  args: {
    scanLogId: v.id("scanLogs"),
    explanationStatus: v.union(v.literal("generated"), v.literal("failed")),
    explanationText: v.optional(v.string()),
    explanationModel: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scanLog = await ctx.db.get(args.scanLogId);
    if (!scanLog) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Scan log not found.",
      });
    }

    await ctx.db.patch(args.scanLogId, {
      explanationStatus: args.explanationStatus,
      explanationText: args.explanationText,
      explanationModel: args.explanationModel,
    });

    return null;
  },
});

export type { ExplanationPromptInput, FailureReason };
