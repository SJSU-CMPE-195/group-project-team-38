import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireRole } from "./authz";

export const getById = query({
  args: { patientId: v.id("patients") },
  returns: v.union(
    v.object({
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["nurse", "admin"]);
    return await ctx.db.get(args.patientId);
  },
});

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  returns: v.array(
    v.object({
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
    })
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    if (args.includeInactive === true) {
      return await ctx.db.query("patients").collect();
    }
    return await ctx.db
      .query("patients")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const create = mutation({
  args: {
    mrn: v.string(),
    displayName: v.string(),
    dob: v.string(),
    allergyCodes: v.array(v.string()),
    allergyLabels: v.array(v.string()),
  },
  returns: v.id("patients"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existingPatient = await ctx.db
      .query("patients")
      .withIndex("by_mrn", (q) => q.eq("mrn", args.mrn))
      .unique();
    if (existingPatient) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A patient with this MRN already exists.",
      });
    }
    const now = Date.now();
    return await ctx.db.insert("patients", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    patientId: v.id("patients"),
    displayName: v.optional(v.string()),
    dob: v.optional(v.string()),
    allergyCodes: v.optional(v.array(v.string())),
    allergyLabels: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existingPatient = await ctx.db.get(args.patientId);
    if (!existingPatient) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Patient not found.",
      });
    }

    await ctx.db.patch(args.patientId, {
      displayName: args.displayName ?? existingPatient.displayName,
      dob: args.dob ?? existingPatient.dob,
      allergyCodes: args.allergyCodes ?? existingPatient.allergyCodes,
      allergyLabels: args.allergyLabels ?? existingPatient.allergyLabels,
      isActive: args.isActive ?? existingPatient.isActive,
      updatedAt: Date.now(),
    });
    return null;
  },
});
