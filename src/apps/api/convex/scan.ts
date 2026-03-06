import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { validateSession } from "./auth";
import { runSafetyEngine } from "./_safetyEngine";

/**
 * Core scan workflow — called when a nurse scans a wristband.
 *
 * Steps:
 *  1. Validate nurse session
 *  2. Look up wristband by UID
 *  3. Fetch patient + active medications
 *  4. Run SafetyEngine
 *  5. Log result to scanLogs
 *  6. Return structured result (real-time via Convex subscription)
 */
export const scanWristband = mutation({
  args: {
    token: v.string(),
    wristbandUid: v.string(),
  },
  handler: async (ctx, { token, wristbandUid }) => {
    // 1. Auth 
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized: invalid or expired session");

    // 2. Wristband lookup
    const wristband = await ctx.db
      .query("wristbands")
      .withIndex("by_uid", (q) => q.eq("uid", wristbandUid))
      .unique();

    if (!wristband) {
      return {
        success: false,
        error: "Wristband not found",
        riskLevel: null,
        patient: null,
        medications: [],
        conflicts: [],
      };
    }

    if (!wristband.isActive) {
      return {
        success: false,
        error: "Wristband is inactive",
        riskLevel: null,
        patient: null,
        medications: [],
        conflicts: [],
      };
    }

    // 3. Fetch patient + medications
    const patient = await ctx.db.get(wristband.patientId);
    if (!patient) throw new Error("Patient record not found");

    const medications = await ctx.db
      .query("medications")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // 4. SafetyEngine
    const safetyResult = runSafetyEngine(
      { allergies: patient.allergies },
      medications.map((m) => ({
        name: m.name,
        contraindications: m.contraindications,
      }))
    );

    // 5. Log to scanLogs
    const scanLogId = await ctx.db.insert("scanLogs", {
      wristbandUid,
      wristbandId: wristband._id,
      patientId: patient._id,
      nurseId: nurse._id,
      medicationIds: medications.map((m) => m._id),
      riskLevel: safetyResult.riskLevel,
      conflicts: safetyResult.conflicts,
      aiExplanation: undefined,
      scannedAt: Date.now(),
    });

    // 6. Return structured result
    return {
      success: true,
      scanLogId,
      riskLevel: safetyResult.riskLevel,
      conflicts: safetyResult.conflicts,
      patient: {
        id: patient._id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        allergies: patient.allergies,
        ward: patient.ward,
      },
      medications: medications.map((m) => ({
        id: m._id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
      })),
    };
  },
});