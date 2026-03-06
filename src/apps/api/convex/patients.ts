import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateSession } from "./auth";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized");
    return ctx.db.query("patients").collect();
  },
});

export const get = query({
  args: { token: v.string(), patientId: v.id("patients") },
  handler: async (ctx, { token, patientId }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse) throw new Error("Unauthorized");

    const patient = await ctx.db.get(patientId);
    if (!patient) throw new Error("Patient not found");

    const wristband = await ctx.db
      .query("wristbands")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    const medications = await ctx.db
      .query("medications")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return { ...patient, wristband, medications };
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    dateOfBirth: v.string(),
    allergies: v.array(v.string()),
    bloodType: v.optional(v.string()),
    ward: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...data }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");
    return ctx.db.insert("patients", data);
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    patientId: v.id("patients"),
    name: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    ward: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { token, patientId, ...updates }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");
    await ctx.db.patch(patientId, updates);
  },
});

export const remove = mutation({
  args: { token: v.string(), patientId: v.id("patients") },
  handler: async (ctx, { token, patientId }) => {
    const nurse = await validateSession(ctx, token);
    if (!nurse || nurse.role !== "admin") throw new Error("Admin only");
    await ctx.db.delete(patientId);
  },
});