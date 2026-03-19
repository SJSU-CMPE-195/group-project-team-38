import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@meditag/env/native";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const keychainService = Constants.expoConfig?.ios?.bundleIdentifier ?? "com.meditag.native";
const authScheme = Constants.expoConfig?.scheme ?? "meditag";

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
