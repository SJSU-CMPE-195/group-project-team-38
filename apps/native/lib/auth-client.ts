import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@meditag/env/native";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

function getSingleConfigValue(value: string | string[] | undefined, fallback: string) {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0] ?? fallback;
}

const keychainService = getSingleConfigValue(
  Constants.expoConfig?.ios?.bundleIdentifier,
  "com.meditag.native",
);
const authScheme = getSingleConfigValue(Constants.expoConfig?.scheme, "meditag");

const secureStore = {
  getItem(key: string) {
    return SecureStore.getItem(key, { keychainService });
  },
  setItem(key: string, value: string) {
    return SecureStore.setItem(key, value, { keychainService });
  },
};

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_CONVEX_SITE_URL,
  plugins: [
    expoClient({
      scheme: authScheme,
      storagePrefix: authScheme,
      storage: secureStore,
    }),
    convexClient(),
    organizationClient(),
  ],
});

const maxOrganizationActivationAttempts = 5;
const organizationActivationDelayMs = 250;

export async function ensureSingleOrganizationIsActive(): Promise<string | null> {
  for (
    let activationAttempt = 0;
    activationAttempt < maxOrganizationActivationAttempts;
    activationAttempt += 1
  ) {
    const sessionResult = await authClient.getSession();
    const activeOrganizationId = sessionResult.data?.session.activeOrganizationId;

    if (typeof activeOrganizationId === "string" && activeOrganizationId.length > 0) {
      return activeOrganizationId;
    }

    const organizationsResult = await authClient.organization.list();
    const organizations = organizationsResult.data;

    if (organizations && organizations.length === 1) {
      const organizationId = organizations[0].id;
      await authClient.organization.setActive({
        organizationId,
      });

      const updatedSessionResult = await authClient.getSession();
      if (updatedSessionResult.data?.session.activeOrganizationId === organizationId) {
        return organizationId;
      }
    }

    if (activationAttempt < maxOrganizationActivationAttempts - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, organizationActivationDelayMs);
      });
    }
  }

  return null;
}
