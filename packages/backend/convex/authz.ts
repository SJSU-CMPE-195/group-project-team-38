import { ConvexError } from "convex/values";

import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

export type AppRole = "nurse" | "admin";
type AuthenticatedContext = QueryCtx | MutationCtx;
type AuthUser = NonNullable<Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>>;

function mapRole(roleValue: string): AppRole | null {
  const roleValues = roleValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  if (roleValues.includes("admin") || roleValues.includes("owner")) {
    return "admin";
  }
  if (roleValues.includes("nurse") || roleValues.includes("member")) {
    return "nurse";
  }
  return null;
}

function readStringField(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null || !(field in value)) {
    return null;
  }
  const candidate = Reflect.get(value, field);
  if (typeof candidate !== "string") {
    return null;
  }
  return candidate;
}

function findActiveMembershipRole(page: unknown, activeOrganizationId: string): string | null {
  if (!Array.isArray(page)) {
    return null;
  }
  for (const candidate of page) {
    const organizationId = readStringField(candidate, "organizationId");
    const role = readStringField(candidate, "role");
    if (organizationId === activeOrganizationId && role !== null) {
      return role;
    }
  }
  return null;
}

export async function requireAuthUser(ctx: AuthenticatedContext): Promise<AuthUser> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
  }
  return authUser;
}

export async function getCurrentRole(ctx: AuthenticatedContext): Promise<AppRole | null> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) {
    return null;
  }

  const profile = await ctx.db
    .query("users")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
    .unique();

  if (!profile || !profile.role) {
    return null;
  }

  return profile.role;

  // const identity = await ctx.auth.getUserIdentity();
  // if (!identity || typeof identity.sessionId !== "string" || typeof identity.subject !== "string") {
  //   return null;
  // }

  // const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
  //   model: "session",
  //   where: [
  //     {
  //       field: "_id",
  //       value: identity.sessionId,
  //     },
  //   ],
  // });

  // if (!session || typeof session.activeOrganizationId !== "string") {
  //   return null;
  // }

  // const memberships = await ctx.runQuery(components.betterAuth.adapter.findMany, {
  //   model: "member",
  //   paginationOpts: {
  //     cursor: null,
  //     numItems: 20,
  //   },
  //   where: [
  //     {
  //       field: "userId",
  //       value: identity.subject,
  //     },
  //   ],
  // });

  // const membershipRole = findActiveMembershipRole(memberships?.page, session.activeOrganizationId);
  // if (!membershipRole) {
  //   return null;
  // }
  // return mapRole(membershipRole);
}

export async function requireRole(
  ctx: AuthenticatedContext,
  allowedRoles: AppRole[],
): Promise<AppRole> {
  const role = await getCurrentRole(ctx);
  if (!role || !allowedRoles.includes(role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You are not authorized for this action.",
    });
  }
  return role;
}
