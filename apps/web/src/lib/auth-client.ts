import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [convexClient(), organizationClient()],
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
