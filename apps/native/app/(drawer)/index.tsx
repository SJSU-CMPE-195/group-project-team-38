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
    title: "1. Scan patient wristband",
    description: "Scan the patient wristband to load their chart.",
  },
  {
    title: "2. Confirm medication",
    description: "Choose the medication you want to verify.",
  },
  {
    title: "3. Review verification",
    description: "Review the result before giving the medication.",
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
        <View className="gap-4">
          <View className="items-center pt-2">
            <MediTagLogo size="sm" />
          </View>

          <Surface variant="secondary" className="rounded-xl p-4">
            <View className="gap-2">
              <Text className="font-medium text-foreground">API status</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`h-2 w-2 rounded-full ${healthCheck === "OK" ? "bg-success" : "bg-danger"}`}
                />
                <Text className="text-xs text-muted">
                  {healthCheck === undefined
                    ? "Checking connection..."
                    : healthCheck === "OK"
                      ? "Connected to backend"
                      : "Backend unavailable"}
                </Text>
              </View>
            </View>
          </Surface>

          {isLoadingProfile ? (
            <Surface variant="secondary" className="rounded-xl p-4">
              <View className="flex-row items-center gap-3">
                <Spinner size="sm" color="default" />
                <Text className="text-sm text-muted">Loading your account…</Text>
              </View>
            </Surface>
          ) : hasWorkspaceAccess ? (
            <>
              <Surface variant="secondary" className="rounded-xl p-5">
                <View className="gap-2">
                  <Text className="text-xl font-semibold text-foreground">
                    Welcome, {userLabel}
                  </Text>
                  {user?.email ? <Text className="text-sm text-muted">{user.email}</Text> : null}
                  <Text className="text-xs font-medium uppercase tracking-wide text-primary">
                    {roleLabel}
                  </Text>
                </View>
              </Surface>

              <Surface variant="secondary" className="rounded-xl p-5">
                <View className="gap-3">
                  <Text className="text-xl font-semibold text-foreground">
                    Start patient verification
                  </Text>
                  <Text className="text-sm leading-6 text-muted">Open the scanner to begin.</Text>
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

              <View className="gap-3">
                {workflowSteps.map((step) => (
                  <Surface key={step.title} variant="secondary" className="rounded-xl p-4">
                    <Text className="mb-1 text-sm font-semibold text-foreground">{step.title}</Text>
                    <Text className="text-sm leading-6 text-muted">{step.description}</Text>
                  </Surface>
                ))}
              </View>
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
            <Button.Label>Sign Out</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}
