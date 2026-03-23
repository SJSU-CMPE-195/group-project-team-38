import { api } from "@meditag/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Spinner, Surface } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient, ensureSingleOrganizationIsActive } from "@/lib/auth-client";

const workflowSteps = [
  {
    title: "1. Scan patient wristband",
    description: "Start from a single QR scan to pull the right patient context into the demo.",
  },
  {
    title: "2. Confirm medication",
    description: "Review the patient snapshot and select the active medication to verify.",
  },
  {
    title: "3. Review result",
    description:
      "See the deterministic pass or fail result before optionally requesting an AI explanation.",
  },
] as const;

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");
  const role = useQuery(api.users.getCurrentUserRole, isAuthenticated ? {} : "skip");
  const [isActivatingWorkspace, setIsActivatingWorkspace] = useState(false);
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

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-2">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Meditag</Text>
        <Text className="text-sm text-muted">
          Guided medication verification demo for bedside nursing workflows.
        </Text>
      </View>

      <Surface variant="secondary" className="mb-4 rounded-xl p-4">
        <Text className="mb-2 font-medium text-foreground">API Status</Text>
        <View className="flex-row items-center gap-2">
          <View
            className={`h-2 w-2 rounded-full ${healthCheck === "OK" ? "bg-success" : "bg-danger"}`}
          />
          <Text className="text-xs text-muted">
            {healthCheck === undefined
              ? "Checking..."
              : healthCheck === "OK"
                ? "Connected to API"
                : "API Disconnected"}
          </Text>
        </View>
      </Surface>

      {isLoadingProfile ? (
        <Surface variant="secondary" className="mb-4 rounded-xl p-4">
          <View className="flex-row items-center gap-3">
            <Spinner size="sm" color="default" />
            <Text className="text-sm text-muted">Loading your demo workspace…</Text>
          </View>
        </Surface>
      ) : hasWorkspaceAccess ? (
        <>
          <Surface variant="secondary" className="mb-4 rounded-xl p-4">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-base font-medium text-foreground">{user.name}</Text>
                <Text className="text-xs text-muted">{user.email}</Text>
                <Text className="text-xs font-medium uppercase tracking-wide text-primary">
                  {role === "admin" ? "Admin review access" : "Nurse demo access"}
                </Text>
              </View>
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  authClient.signOut();
                }}
              >
                <Button.Label>Sign Out</Button.Label>
              </Button>
            </View>
          </Surface>

          <Surface variant="secondary" className="mb-4 rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">
                Start patient safety check
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Launch the nurse flow, scan the QR wristband, and move directly into medication
                verification without starter-template navigation.
              </Text>
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

          <View className="mb-4 gap-3">
            {workflowSteps.map((step) => (
              <Surface key={step.title} variant="secondary" className="rounded-xl p-4">
                <Text className="mb-1 text-sm font-semibold text-foreground">{step.title}</Text>
                <Text className="text-sm leading-6 text-muted">{step.description}</Text>
              </Surface>
            ))}
          </View>
        </>
      ) : hasWorkspaceUser ? (
        <Surface variant="secondary" className="mb-4 rounded-xl p-4">
          <View className="gap-3">
            <Text className="text-base font-medium text-foreground">
              Preparing your demo workspace
            </Text>
            <Text className="text-sm text-muted">
              Your account is signed in, but the demo organization is still being activated for this
              session.
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
                <Button.Label>Retry workspace activation</Button.Label>
              </Button>
            </View>
          </View>
        </Surface>
      ) : (
        <>
          <Surface variant="secondary" className="mb-4 rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">
                Sign in to begin the nurse demo
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Authenticate first, then the app takes you straight into the MediTag workflow entry
                for scanning and medication verification.
              </Text>
            </View>
          </Surface>

          <View className="mb-5 gap-4">
            <SignIn />
            <SignUp />
          </View>
        </>
      )}
    </Container>
  );
}
