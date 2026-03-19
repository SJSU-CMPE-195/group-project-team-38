import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const localConvexUrl = "http://127.0.0.1:3210";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_CONVEX_URL: z.url(),
    EXPO_PUBLIC_CONVEX_SITE_URL: z.url(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL ?? localConvexUrl,
    EXPO_PUBLIC_CONVEX_SITE_URL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? localConvexUrl,
  },
  emptyStringAsUndefined: true,
});
