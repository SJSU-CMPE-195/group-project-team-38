import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentRole, requireAuthUser } from "./authz";
import { ConvexError } from "convex/values";
import { requireRole } from "./authz";

export const upsertCurrentUserProfile = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const authUser = await requireAuthUser(ctx);
    const now = Date.now();

    const existingProfile = await ctx.db
      .query("users")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        displayName: authUser.name,
        email: authUser.email,
        isActive: true,
        updatedAt: now,
      });
      return existingProfile._id;
    }

    return await ctx.db.insert("users", {
      authUserId: authUser._id,
      displayName: authUser.name,
      email: authUser.email,
      role: undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getCurrentUserRole = query({
  args: {},
  returns: v.union(v.literal("nurse"), v.literal("admin"), v.null()),
  handler: async (ctx) => {
    await requireAuthUser(ctx);
    return await getCurrentRole(ctx);
  },
});

export const listPendingUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      authUserId: v.string(),
      displayName: v.string(),
      email: v.string(),
      role: v.optional(v.union(v.literal("nurse"), v.literal("admin"))),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const users = await ctx.db.query("users").collect();
    return users.filter((user) => user.role === undefined);
  },
});

export const listUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      authUserId: v.string(),
      displayName: v.string(),
      email: v.string(),
      role: v.optional(v.union(v.literal("nurse"), v.literal("admin"))),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.db.query("users").collect();
  },
});

export const assignUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("nurse"), v.literal("admin")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found.",
      });
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return null;
  },
});