import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { organization } from "better-auth/plugins";

import type { DataModel } from "./_generated/dataModel";

import { components } from "./_generated/api";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

const defaultNativeAppUrl = "mybettertapp://";
const expoDevelopmentOrigins = ["exp://", "exp://**", "exp://192.168.*.*:*/**"];

type AuthEnvironment = {
  siteUrl: string;
  nativeAppUrl: string;
  isDevelopment: boolean;
};

const getAuthEnvironment = (): AuthEnvironment => {
  const siteUrl = process.env.SITE_URL ?? process.env.CONVEX_SITE_URL ?? "http://localhost:3001";

  return {
    siteUrl,
    nativeAppUrl: process.env.NATIVE_APP_URL ?? defaultNativeAppUrl,
    isDevelopment: process.env.NODE_ENV === "development",
  };
};

const createTrustedOrigins = (environment: AuthEnvironment): string[] => {
  if (!environment.isDevelopment) {
    return [environment.siteUrl, environment.nativeAppUrl];
  }
  return [environment.siteUrl, environment.nativeAppUrl, ...expoDevelopmentOrigins];
};

const createBaseAuthOptions = (
  environment: AuthEnvironment,
): Omit<BetterAuthOptions, "database"> => {
  return {
    baseURL: environment.siteUrl,
    trustedOrigins: createTrustedOrigins(environment),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      expo(),
      organization(),
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
  };
};

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>): BetterAuthOptions => {
  const environment = getAuthEnvironment();
  return {
    ...createBaseAuthOptions(environment),
    database: authComponent.adapter(ctx),
  };
};

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});