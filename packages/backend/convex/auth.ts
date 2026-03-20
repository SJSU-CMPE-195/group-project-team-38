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
const localDevelopmentOrigins = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];

type AuthEnvironment = {
  siteUrl: string;
  nativeAppUrl: string;
  isDevelopment: boolean;
};

const isLocalUrl = (value: string): boolean => {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
};

const getAuthEnvironment = (): AuthEnvironment => {
  const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.SITE_URL ?? "http://127.0.0.1:3213";
  const isLocalDeployment = process.env.CONVEX_DEPLOYMENT?.startsWith("local:") ?? false;

  return {
    siteUrl,
    nativeAppUrl: process.env.NATIVE_APP_URL ?? defaultNativeAppUrl,
    isDevelopment:
      process.env.NODE_ENV === "development" || isLocalDeployment || isLocalUrl(siteUrl),
  };
};

const createTrustedOrigins = (environment: AuthEnvironment): string[] => {
  if (!environment.isDevelopment) {
    return [environment.siteUrl, environment.nativeAppUrl];
  }
  return [
    environment.siteUrl,
    environment.nativeAppUrl,
    ...expoDevelopmentOrigins,
    ...localDevelopmentOrigins,
  ];
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
