import { api } from "@meditag/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Spinner, Surface, useToast } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";
import { authClient, ensureSingleOrganizationIsActive } from "@/lib/auth-client";

const workflowSteps = [
  {
    title: "Scan",
    description: "Capture the wristband QR code.",
  },
  {
    title: "Select",
    description: "Pick the medication from the patient chart.",
  },
  {
    title: "Review",
    description: "Use the result before administration.",
  },
] as const;

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isActivatingWorkspace, setIsActivatingWorkspace] = useState(false);
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");
  const role = useQuery(api.users.getCurrentUserRole, isAuthenticated ? {} : "skip");
  const hasLoadedUser = user !== undefined;
  const hasLoadedRole = role !== undefined;
  const hasWorkspaceUser = user !== undefined && user !== null;
  const hasWorkspaceRole = role !== undefined && role !== null;

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthenticated || !hasWorkspaceUser || role !== null) {
      setIsActivatingWorkspace(false);
      return () => {
        isCancelled = true;
      };
    }

    setIsActivatingWorkspace(true);

    void ensureSingleOrganizationIsActive().finally(() => {
      if (!isCancelled) {
        setIsActivatingWorkspace(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [hasWorkspaceUser, isAuthenticated, role]);

  const isLoadingProfile =
    isAuthenticated &&
    (!hasLoadedUser ||
      !hasLoadedRole ||
      (hasWorkspaceUser && role === null && isActivatingWorkspace));
  const hasWorkspaceAccess = hasWorkspaceUser && hasWorkspaceRole;
  const roleLabel = role === "admin" ? "Admin review access" : "Nurse demo access";
  const userLabel = user?.name?.trim() || user?.email || "Signed-in user";

  return (
    <Container className="px-4 pb-4">
      <View className="flex-1 justify-between py-6">
        <View className="gap-5">
          <View className="items-center pt-2">
            <MediTagLogo size="sm" />
          </View>

          {isLoadingProfile ? (
            <Surface variant="secondary" className="rounded-xl p-4">
              <View className="flex-row items-center gap-3">
                <Spinner size="sm" color="default" />
                <Text className="text-sm text-muted">Loading your account…</Text>
              </View>
            </Surface>
          ) : hasWorkspaceAccess ? (
            <>
              <Surface variant="secondary" className="rounded-2xl p-5">
                <View className="gap-4">
                  <View className="gap-2">
                    <Text className="text-3xl font-semibold tracking-tight text-foreground">
                      Ready to verify
                    </Text>
                    <Text className="text-base leading-7 text-muted">
                      {userLabel}
                      {user?.email ? ` • ${user.email}` : ""}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    <View className="rounded-full bg-primary/10 px-3 py-2">
                      <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {roleLabel}
                      </Text>
                    </View>
                    <View className="rounded-full bg-background px-3 py-2">
                      <Text className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        {healthCheck === undefined
                          ? "Checking backend"
                          : healthCheck === "OK"
                            ? "Backend connected"
                            : "Backend unavailable"}
                      </Text>
                    </View>
                  </View>

                  <Button
                    testID="start-wristband-scan-button"
                    accessibilityLabel="Start wristband scan"
                    onPress={() => {
                      router.push("./scan");
                    }}
                  >
                    <Button.Label>Start wristband scan</Button.Label>
                  </Button>
                </View>
              </Surface>

              <Surface variant="secondary" className="rounded-2xl p-5">
                <View className="gap-3">
                  <Text className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Workflow
                  </Text>
                  <View className="gap-3">
                    {workflowSteps.map((step, index) => (
                      <View
                        key={step.title}
                        className="flex-row items-start gap-3 rounded-xl bg-background px-4 py-4"
                      >
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Text className="text-sm font-semibold text-primary">{index + 1}</Text>
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-base font-semibold text-foreground">
                            {step.title}
                          </Text>
                          <Text className="text-sm leading-6 text-muted">{step.description}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </Surface>
            </>
          ) : hasWorkspaceUser ? (
            <Surface variant="secondary" className="rounded-xl p-4">
              <View className="gap-3">
                <Text className="text-base font-medium text-foreground">Almost ready</Text>
                <Text className="text-sm text-muted">Finishing account setup.</Text>
                <View className="flex-row items-center gap-3">
                  {isActivatingWorkspace ? <Spinner size="sm" color="default" /> : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={isActivatingWorkspace}
                    onPress={() => {
                      setIsActivatingWorkspace(true);
                      void ensureSingleOrganizationIsActive().finally(() => {
                        setIsActivatingWorkspace(false);
                      });
                    }}
                  >
                    <Button.Label>Try again</Button.Label>
                  </Button>
                </View>
              </View>
            </Surface>
          ) : (
            <Surface variant="secondary" className="rounded-xl p-4">
              <Text className="text-sm text-muted">Your account is still loading.</Text>
            </Surface>
          )}
        </View>

        <Button
          testID="sign-out-button"
          accessibilityLabel="Sign out"
          variant="danger"
          onPress={async () => {
            setIsSigningOut(true);

            const result = await authClient.signOut();

            if (result.error) {
              toast.show({
                variant: "danger",
                label: result.error.message || "Failed to sign out",
              });
              setIsSigningOut(false);
              return;
            }

            setIsSigningOut(false);
          }}
          isDisabled={isSigningOut}
        >
          {isSigningOut ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Sign out</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
