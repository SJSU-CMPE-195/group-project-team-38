import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateSession } from "./auth";

/** Real-time feed of all scan logs — admin portal subscribes to this */
export const listAll = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, limit = 50 }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized");
    if (nurse.role !== "admin") throw new Error("Admin only");

    const logs = await ctx.db
      .query("scanLogs")
      .withIndex("by_scanned_at")
      .order("desc")
      .take(limit);

    return Promise.all(logs.map(enrichLog(ctx)));
  },
});

/** Scan logs for a specific patient */
export const listByPatient = query({
  args: {
    token: v.string(),
    patientId: v.id("patients"),
  },
  handler: async (ctx, { token, patientId }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized");

    const logs = await ctx.db
      .query("scanLogs")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .order("desc")
      .collect();

    return Promise.all(logs.map(enrichLog(ctx)));
  },
});

/** Scan logs by the current nurse (for mobile history view) */
export const listByNurse = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized");

    const logs = await ctx.db
      .query("scanLogs")
      .withIndex("by_nurse", (q) => q.eq("nurseId", nurse._id))
      .order("desc")
      .take(20);

    return Promise.all(logs.map(enrichLog(ctx)));
  },
});

/** Patch AI explanation onto an existing scan log (called by aiGateway) */
export const patchAiExplanation = mutation({
  args: {
    scanLogId: v.id("scanLogs"),
    aiExplanation: v.string(),
  },
  handler: async (ctx, { scanLogId, aiExplanation }) => {
    await ctx.db.patch(scanLogId, { aiExplanation });
  },
});

// Helpers

function enrichLog(ctx: any) {
  return async (log: any) => {
    const [patient, nurse] = await Promise.all([
      ctx.db.get(log.patientId),
      ctx.db.get(log.nurseId),
    ]);
    return {
      ...log,
      patientName: patient?.name ?? "Unknown",
      nurseName: nurse?.name ?? "Unknown",
    };
  };
}