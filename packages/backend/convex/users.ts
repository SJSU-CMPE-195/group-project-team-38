import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentRole, requireAuthUser } from "./authz";

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
