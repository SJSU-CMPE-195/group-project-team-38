import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { requireRole } from "./authz";

const failureReasonValidator = v.union(
  v.literal("identity_mismatch"),
  v.literal("allergy_conflict"),
  v.literal("wristband_not_found"),
  v.literal("medication_not_found"),
);

const scanLogMetadataValidator = v.object({
  scanType: v.union(v.literal("qr"), v.literal("nfc"), v.literal("unknown")),
  deviceId: v.optional(v.string()),
});

const rawScanLogValidator = v.object({
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
  metadata: scanLogMetadataValidator,
  createdAt: v.number(),
});

const scannerValidator = v.object({
  authUserId: v.string(),
  displayName: v.optional(v.string()),
  email: v.optional(v.string()),
});

const patientSummaryValidator = v.object({
  _id: v.id("patients"),
  mrn: v.string(),
  displayName: v.string(),
  dob: v.string(),
  allergyLabels: v.array(v.string()),
});

const medicationSummaryValidator = v.object({
  _id: v.id("medications"),
  displayName: v.string(),
  rxNormCode: v.string(),
  route: v.optional(v.string()),
  dose: v.optional(v.string()),
  frequency: v.optional(v.string()),
});

const wristbandSummaryValidator = v.object({
  _id: v.id("wristbands"),
  token: v.string(),
  tokenType: v.union(v.literal("qr"), v.literal("nfc")),
  isActive: v.boolean(),
});

const adminScanLogListItemValidator = v.object({
  scanLogId: v.id("scanLogs"),
  createdAt: v.number(),
  result: v.union(v.literal("pass"), v.literal("fail")),
  failureReasons: v.array(failureReasonValidator),
  explanationStatus: v.union(
    v.literal("none"),
    v.literal("requested"),
    v.literal("generated"),
    v.literal("failed"),
  ),
  explanationText: v.optional(v.string()),
  explanationModel: v.optional(v.string()),
  scannedToken: v.string(),
  metadata: scanLogMetadataValidator,
  scanner: scannerValidator,
  patient: v.union(patientSummaryValidator, v.null()),
  medication: v.union(medicationSummaryValidator, v.null()),
  wristband: v.union(wristbandSummaryValidator, v.null()),
});

const patientDetailValidator = v.object({
  _id: v.id("patients"),
  _creationTime: v.number(),
  mrn: v.string(),
  displayName: v.string(),
  dob: v.string(),
  allergyCodes: v.array(v.string()),
  allergyLabels: v.array(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const medicationDetailValidator = v.object({
  _id: v.id("medications"),
  _creationTime: v.number(),
  patientId: v.id("patients"),
  displayName: v.string(),
  rxNormCode: v.string(),
  route: v.optional(v.string()),
  dose: v.optional(v.string()),
  frequency: v.optional(v.string()),
  ingredientCodes: v.array(v.string()),
  contraindicationAllergyCodes: v.array(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const wristbandDetailValidator = v.object({
  _id: v.id("wristbands"),
  _creationTime: v.number(),
  patientId: v.id("patients"),
  token: v.string(),
  tokenType: v.union(v.literal("qr"), v.literal("nfc")),
  issuedAt: v.number(),
  revokedAt: v.optional(v.number()),
  isActive: v.boolean(),
});

const adminScanLogDetailValidator = v.union(
  v.object({
    scanLog: rawScanLogValidator,
    scanner: scannerValidator,
    patient: v.union(patientDetailValidator, v.null()),
    medication: v.union(medicationDetailValidator, v.null()),
    wristband: v.union(wristbandDetailValidator, v.null()),
  }),
  v.null(),
);

function matchesFilters(
  scanLog: Doc<"scanLogs">,
  args: {
    result?: "pass" | "fail";
    patientId?: Id<"patients">;
    createdAtStart?: number;
    createdAtEnd?: number;
  },
) {
  if (args.result && scanLog.result !== args.result) {
    return false;
  }
  if (args.patientId && scanLog.patientId !== args.patientId) {
    return false;
  }
  if (args.createdAtStart !== undefined && scanLog.createdAt < args.createdAtStart) {
    return false;
  }
  if (args.createdAtEnd !== undefined && scanLog.createdAt > args.createdAtEnd) {
    return false;
  }
  return true;
}

async function loadScanner(ctx: QueryCtx, authUserId: string) {
  const profile = await ctx.db
    .query("users")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
    .unique();

  return {
    authUserId,
    displayName: profile?.displayName,
    email: profile?.email,
  };
}

async function loadAdminListItem(ctx: QueryCtx, scanLog: Doc<"scanLogs">) {
  const [scanner, patient, medication, wristband] = await Promise.all([
    loadScanner(ctx, scanLog.authUserId),
    scanLog.patientId ? ctx.db.get(scanLog.patientId) : null,
    scanLog.medicationId ? ctx.db.get(scanLog.medicationId) : null,
    scanLog.wristbandId ? ctx.db.get(scanLog.wristbandId) : null,
  ]);

  return {
    scanLogId: scanLog._id,
    createdAt: scanLog.createdAt,
    result: scanLog.result,
    failureReasons: scanLog.failureReasons,
    explanationStatus: scanLog.explanationStatus,
    explanationText: scanLog.explanationText,
    explanationModel: scanLog.explanationModel,
    scannedToken: scanLog.scannedToken,
    metadata: scanLog.metadata,
    scanner,
    patient: patient
      ? {
          _id: patient._id,
          mrn: patient.mrn,
          displayName: patient.displayName,
          dob: patient.dob,
          allergyLabels: patient.allergyLabels,
        }
      : null,
    medication: medication
      ? {
          _id: medication._id,
          displayName: medication.displayName,
          rxNormCode: medication.rxNormCode,
          route: medication.route,
          dose: medication.dose,
          frequency: medication.frequency,
        }
      : null,
    wristband: wristband
      ? {
          _id: wristband._id,
          token: wristband.token,
          tokenType: wristband.tokenType,
          isActive: wristband.isActive,
        }
      : null,
  };
}

export const listForAdminReview = query({
  args: {
    limit: v.optional(v.number()),
    result: v.optional(v.union(v.literal("pass"), v.literal("fail"))),
    patientId: v.optional(v.id("patients")),
    createdAtStart: v.optional(v.number()),
    createdAtEnd: v.optional(v.number()),
  },
  returns: v.array(adminScanLogListItemValidator),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const scanLogs = await ctx.db
      .query("scanLogs")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
    const filteredLogs = scanLogs
      .filter((scanLog) => matchesFilters(scanLog, args))
      .slice(0, limit);

    return await Promise.all(filteredLogs.map((scanLog) => loadAdminListItem(ctx, scanLog)));
  },
});

export const getAdminScanLogDetail = query({
  args: {
    scanLogId: v.id("scanLogs"),
  },
  returns: adminScanLogDetailValidator,
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const scanLog = await ctx.db.get(args.scanLogId);
    if (!scanLog) {
      return null;
    }

    const [scanner, patient, medication, wristband] = await Promise.all([
      loadScanner(ctx, scanLog.authUserId),
      scanLog.patientId ? ctx.db.get(scanLog.patientId) : null,
      scanLog.medicationId ? ctx.db.get(scanLog.medicationId) : null,
      scanLog.wristbandId ? ctx.db.get(scanLog.wristbandId) : null,
    ]);

    return {
      scanLog,
      scanner,
      patient,
      medication,
      wristband,
    };
  },
});
