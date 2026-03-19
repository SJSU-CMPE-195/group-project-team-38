import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireAuthUser, requireRole } from "./authz";

const failureReasonValidator = v.union(
  v.literal("identity_mismatch"),
  v.literal("allergy_conflict"),
  v.literal("wristband_not_found"),
  v.literal("medication_not_found"),
);

const scanContextMedicationValidator = v.object({
  _id: v.id("medications"),
  displayName: v.string(),
  rxNormCode: v.string(),
  route: v.optional(v.string()),
  dose: v.optional(v.string()),
  frequency: v.optional(v.string()),
});

const scanContextPatientValidator = v.object({
  _id: v.id("patients"),
  mrn: v.string(),
  displayName: v.string(),
  dob: v.string(),
  allergyLabels: v.array(v.string()),
});

const scanContextResultValidator = v.union(
  v.object({
    status: v.literal("resolved"),
    wristbandId: v.id("wristbands"),
    patient: scanContextPatientValidator,
    medications: v.array(scanContextMedicationValidator),
  }),
  v.object({
    status: v.literal("unknown_wristband"),
  }),
  v.object({
    status: v.literal("inactive_wristband"),
    wristbandId: v.id("wristbands"),
  }),
);

type WristbandResolution =
  | {
      status: "resolved";
      wristband: {
        _id: Id<"wristbands">;
        patientId: Id<"patients">;
      };
      patient: {
        _id: Id<"patients">;
        mrn: string;
        displayName: string;
        dob: string;
        allergyLabels: string[];
      };
    }
  | {
      status: "unknown_wristband";
    }
  | {
      status: "inactive_wristband";
      wristband: {
        _id: Id<"wristbands">;
      };
    };

function hasOverlap(first: string[], second: string[]): boolean {
  const values = new Set(first);
  return second.some((value) => values.has(value));
}

async function resolveWristbandPatient(
  ctx: QueryCtx | MutationCtx,
  scannedToken: string,
): Promise<WristbandResolution> {
  const wristband = await ctx.db
    .query("wristbands")
    .withIndex("by_token", (q) => q.eq("token", scannedToken))
    .unique();

  if (!wristband) {
    return { status: "unknown_wristband" };
  }

  if (!wristband.isActive) {
    return {
      status: "inactive_wristband",
      wristband: {
        _id: wristband._id,
      },
    };
  }

  const patient = await ctx.db.get(wristband.patientId);
  if (!patient) {
    throw new ConvexError({
      code: "DATA_INTEGRITY_ERROR",
      message: "Active wristband references a missing patient.",
    });
  }

  return {
    status: "resolved",
    wristband: {
      _id: wristband._id,
      patientId: wristband.patientId,
    },
    patient: {
      _id: patient._id,
      mrn: patient.mrn,
      displayName: patient.displayName,
      dob: patient.dob,
      allergyLabels: patient.allergyLabels,
    },
  };
}

async function listActiveMedicationsForPatient(ctx: QueryCtx, patientId: Id<"patients">) {
  const medications = await ctx.db
    .query("medications")
    .withIndex("by_patient_id_and_active", (q) => q.eq("patientId", patientId).eq("isActive", true))
    .collect();

  return medications
    .map((medication) => ({
      _id: medication._id,
      displayName: medication.displayName,
      rxNormCode: medication.rxNormCode,
      route: medication.route,
      dose: medication.dose,
      frequency: medication.frequency,
    }))
    .sort((first, second) => first.displayName.localeCompare(second.displayName));
}

export const getScanContext = query({
  args: {
    scannedToken: v.string(),
  },
  returns: scanContextResultValidator,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["nurse", "admin"]);

    const resolution = await resolveWristbandPatient(ctx, args.scannedToken);
    if (resolution.status === "unknown_wristband") {
      return resolution;
    }

    if (resolution.status === "inactive_wristband") {
      return {
        status: "inactive_wristband" as const,
        wristbandId: resolution.wristband._id,
      };
    }

    const medications = await listActiveMedicationsForPatient(ctx, resolution.patient._id);

    return {
      status: "resolved" as const,
      wristbandId: resolution.wristband._id,
      patient: resolution.patient,
      medications,
    };
  },
});

export const verifyMedicationScan = mutation({
  args: {
    scannedToken: v.string(),
    scanType: v.optional(v.union(v.literal("qr"), v.literal("nfc"), v.literal("unknown"))),
    selectedMedicationId: v.optional(v.id("medications")),
    selectedMedicationCode: v.optional(v.string()),
    requestExplanation: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),
  },
  returns: v.object({
    result: v.union(v.literal("pass"), v.literal("fail")),
    failureReasons: v.array(failureReasonValidator),
    patientId: v.optional(v.id("patients")),
    medicationId: v.optional(v.id("medications")),
    scanLogId: v.id("scanLogs"),
    explanationStatus: v.union(
      v.literal("none"),
      v.literal("requested"),
      v.literal("generated"),
      v.literal("failed"),
    ),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["nurse", "admin"]);
    const authUser = await requireAuthUser(ctx);
    const resolution = await resolveWristbandPatient(ctx, args.scannedToken);

    const failureReasons: Array<
      "identity_mismatch" | "allergy_conflict" | "wristband_not_found" | "medication_not_found"
    > = [];

    if (resolution.status !== "resolved") {
      failureReasons.push("wristband_not_found");
    }

    const patient =
      resolution.status === "resolved" ? await ctx.db.get(resolution.patient._id) : null;
    const wristband = resolution.status === "resolved" ? resolution.wristband : null;

    let medication = args.selectedMedicationId ? await ctx.db.get(args.selectedMedicationId) : null;

    const selectedMedicationCode = args.selectedMedicationCode;
    if (!medication && selectedMedicationCode !== undefined) {
      const codeMatches = await ctx.db
        .query("medications")
        .withIndex("by_rxnorm_code", (q) => q.eq("rxNormCode", selectedMedicationCode))
        .collect();
      medication = codeMatches.find((candidate) => candidate.isActive) ?? null;
    }

    if (!medication || !medication.isActive) {
      failureReasons.push("medication_not_found");
    }

    if (patient && medication && medication.patientId !== patient._id) {
      failureReasons.push("identity_mismatch");
    }

    if (
      patient &&
      medication &&
      hasOverlap(patient.allergyCodes, medication.contraindicationAllergyCodes)
    ) {
      failureReasons.push("allergy_conflict");
    }

    const result: "pass" | "fail" = failureReasons.length === 0 ? "pass" : "fail";
    const explanationStatus: "none" | "requested" | "generated" | "failed" =
      result === "fail" && args.requestExplanation === true ? "requested" : "none";

    const scanLogId = await ctx.db.insert("scanLogs", {
      authUserId: authUser._id,
      patientId: patient?._id,
      wristbandId: wristband?._id,
      medicationId: medication?._id,
      scannedToken: args.scannedToken,
      result,
      failureReasons,
      deterministicDecisionVersion: "v1",
      explanationStatus,
      metadata: {
        scanType: args.scanType ?? "unknown",
        deviceId: args.deviceId,
      },
      createdAt: Date.now(),
    });

    if (explanationStatus === "requested") {
      await ctx.scheduler.runAfter(0, internal.scanLogExplanationGeneration.generateForScanLog, {
        scanLogId,
      });
    }

    return {
      result,
      failureReasons,
      patientId: patient?._id,
      medicationId: medication?._id,
      scanLogId,
      explanationStatus,
    };
  },
});

export const getRecentScanLogs = query({
  args: {
    limit: v.optional(v.number()),
    patientId: v.optional(v.id("patients")),
  },
  returns: v.array(
    v.object({
      _id: v.id("scanLogs"),
      _creationTime: v.number(),
      authUserId: v.string(),
      patientId: v.optional(v.id("patients")),
      wristbandId: v.optional(v.id("wristbands")),
      medicationId: v.optional(v.id("medications")),
      scannedToken: v.string(),
      result: v.union(v.literal("pass"), v.literal("fail")),
      failureReasons: v.array(failureReasonValidator),
      deterministicDecisionVersion: v.string(),
      explanationStatus: v.union(
        v.literal("none"),
        v.literal("requested"),
        v.literal("generated"),
        v.literal("failed"),
      ),
      explanationText: v.optional(v.string()),
      explanationModel: v.optional(v.string()),
      metadata: v.object({
        scanType: v.union(v.literal("qr"), v.literal("nfc"), v.literal("unknown")),
        deviceId: v.optional(v.string()),
      }),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const role = await requireRole(ctx, ["nurse", "admin"]);
    const authUser = await requireAuthUser(ctx);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    if (role === "admin") {
      const logs = await ctx.db
        .query("scanLogs")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
      if (!args.patientId) {
        return logs;
      }
      return logs.filter((log) => log.patientId === args.patientId);
    }

    const nurseLogs = await ctx.db
      .query("scanLogs")
      .withIndex("by_auth_user_id_and_created_at", (q) => q.eq("authUserId", authUser._id))
      .order("desc")
      .take(limit);
    if (!args.patientId) {
      return nurseLogs;
    }
    return nurseLogs.filter((log) => log.patientId === args.patientId);
  },
});
