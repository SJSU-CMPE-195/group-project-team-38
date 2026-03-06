import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const nurse = await ctx.db
      .query("nurses")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!nurse) throw new Error("Invalid credentials");

    const hash = await hashPassword(password);
    if (hash !== nurse.passwordHash) throw new Error("Invalid credentials");

    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_nurse", (q) => q.eq("nurseId", nurse._id))
      .collect();
    await Promise.all(existing.map((s) => ctx.db.delete(s._id)));

    const token = generateToken();
    await ctx.db.insert("sessions", {
      nurseId: nurse._id,
      token,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return {
      token,
      nurse: {
        id: nurse._id,
        name: nurse.name,
        email: nurse.email,
        role: nurse.role,
      },
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return { success: true };
  },
});

export async function validateSession(
  ctx: any,
  token: string
): Promise<{ _id: any; name: string; email: string; role: string } | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) return null;

  const nurse = await ctx.db.get(session.nurseId);
  return nurse ?? null;
}


export const createNurse = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("nurse"), v.literal("admin")),
  },
  handler: async (ctx, { name, email, password, role }) => {
    const existing = await ctx.db
      .query("nurses")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) throw new Error("Email already registered");

    const passwordHash = await hashPassword(password);
    const id = await ctx.db.insert("nurses", { name, email, passwordHash, role });
    return id;
  },
});