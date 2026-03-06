import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateSession } from "./auth";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");
    return ctx.db.query("wristbands").collect();
  },
});

export const assign = mutation({
  args: {
    token: v.string(),
    uid: v.string(),
    patientId: v.id("patients"),
  },
  handler: async (ctx, { token, uid, patientId }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");

    // Deactivate any existing wristband for this patient
    const existing = await ctx.db
      .query("wristbands")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { isActive: false });

    return ctx.db.insert("wristbands", {
      uid,
      patientId,
      isActive: true,
      assignedAt: Date.now(),
      assignedBy: nurse._id,
    });
  },
});

export const deactivate = mutation({
  args: { token: v.string(), wristbandId: v.id("wristbands") },
  handler: async (ctx, { token, wristbandId }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");
    await ctx.db.patch(wristbandId, { isActive: false });
  },
});