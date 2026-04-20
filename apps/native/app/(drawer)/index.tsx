import { api } from "@meditag/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Spinner, Surface, useToast } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";
import { authClient, ensureSingleOrganizationIsActive } from "@/lib/auth-client";

export default function Home() {
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
  const greetingName = user?.name?.trim().split(" ")[0];

  return (
    <Container className="px-6">
      <View className="flex-1 justify-between py-6">
        <View className="gap-8">
          <View className="items-center">
            <MediTagLogo size="sm" />
          </View>

          {isLoadingProfile ? (
            <View className="flex-row items-center justify-center gap-3 py-12">
              <Spinner size="sm" color="default" />
              <Text className="text-sm text-muted">Loading…</Text>
            </View>
          ) : hasWorkspaceAccess ? (
            <View className="gap-8">
              <View className="gap-2">
                <Text className="text-4xl font-semibold tracking-tight text-foreground">
                  Ready to verify
                </Text>
                <Text className="text-base leading-7 text-muted">
                  {greetingName ? `Welcome back, ${greetingName}.` : "Welcome back."} Start patient
                  verification when you reach the bedside.
                </Text>
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
          ) : hasWorkspaceUser ? (
            <Surface variant="secondary" className="rounded-2xl border border-border p-5">
              <View className="gap-3">
                <Text className="text-base font-medium text-foreground">
                  Setting up your account
                </Text>
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
                    <Button.Label>Retry</Button.Label>
                  </Button>
                </View>
              </View>
            </Surface>
          ) : (
            <View className="flex-row items-center justify-center gap-3 py-12">
              <Spinner size="sm" color="default" />
              <Text className="text-sm text-muted">Loading…</Text>
            </View>
          )}
        </View>

        <Button
          testID="sign-out-button"
          accessibilityLabel="Sign out"
          variant="tertiary"
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
