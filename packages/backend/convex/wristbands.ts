import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireRole } from "./authz";

export const getByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("wristbands"),
      _creationTime: v.number(),
      patientId: v.id("patients"),
      token: v.string(),
      tokenType: v.union(v.literal("qr"), v.literal("nfc")),
      issuedAt: v.number(),
      revokedAt: v.optional(v.number()),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["nurse", "admin"]);
    return await ctx.db
      .query("wristbands")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
  },
});

export const assign = mutation({
  args: {
    patientId: v.id("patients"),
    token: v.string(),
    tokenType: v.union(v.literal("qr"), v.literal("nfc")),
  },
  returns: v.id("wristbands"),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Patient not found.",
      });
    }

    const existingToken = await ctx.db
      .query("wristbands")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (existingToken?.isActive) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Token is already active on a wristband.",
      });
    }

    return await ctx.db.insert("wristbands", {
      patientId: args.patientId,
      token: args.token,
      tokenType: args.tokenType,
      issuedAt: Date.now(),
      isActive: true,
    });
  },
});

export const deactivate = mutation({
  args: { wristbandId: v.id("wristbands") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const wristband = await ctx.db.get(args.wristbandId);
    if (!wristband) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Wristband not found.",
      });
    }
    if (!wristband.isActive) {
      return null;
    }
    await ctx.db.patch(args.wristbandId, {
      isActive: false,
      revokedAt: Date.now(),
    });
    return null;
  },
});
