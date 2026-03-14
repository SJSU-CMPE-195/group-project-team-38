import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireRole } from "./authz";

export const listByPatient = query({
  args: {
    patientId: v.id("patients"),
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
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
    }),
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["nurse", "admin"]);
    if (args.includeInactive === true) {
      return await ctx.db
        .query("medications")
        .withIndex("by_patient_id", (q) => q.eq("patientId", args.patientId))
        .collect();
    }
    return await ctx.db
      .query("medications")
      .withIndex("by_patient_id_and_active", (q) =>
        q.eq("patientId", args.patientId).eq("isActive", true),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    displayName: v.string(),
    rxNormCode: v.string(),
    route: v.optional(v.string()),
    dose: v.optional(v.string()),
    frequency: v.optional(v.string()),
    ingredientCodes: v.array(v.string()),
    contraindicationAllergyCodes: v.array(v.string()),
  },
  returns: v.id("medications"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Patient not found.",
      });
    }
    const now = Date.now();
    return await ctx.db.insert("medications", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    medicationId: v.id("medications"),
    displayName: v.optional(v.string()),
    rxNormCode: v.optional(v.string()),
    route: v.optional(v.string()),
    dose: v.optional(v.string()),
    frequency: v.optional(v.string()),
    ingredientCodes: v.optional(v.array(v.string())),
    contraindicationAllergyCodes: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const medication = await ctx.db.get(args.medicationId);
    if (!medication) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Medication not found.",
      });
    }
    await ctx.db.patch(args.medicationId, {
      displayName: args.displayName ?? medication.displayName,
      rxNormCode: args.rxNormCode ?? medication.rxNormCode,
      route: args.route ?? medication.route,
      dose: args.dose ?? medication.dose,
      frequency: args.frequency ?? medication.frequency,
      ingredientCodes: args.ingredientCodes ?? medication.ingredientCodes,
      contraindicationAllergyCodes:
        args.contraindicationAllergyCodes ?? medication.contraindicationAllergyCodes,
      isActive: args.isActive ?? medication.isActive,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deactivate = mutation({
  args: { medicationId: v.id("medications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const medication = await ctx.db.get(args.medicationId);
    if (!medication) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Medication not found.",
      });
    }
    if (!medication.isActive) {
      return null;
    }
    await ctx.db.patch(args.medicationId, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return null;
  },
});
