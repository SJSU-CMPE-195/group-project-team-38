import { api } from "@meditag/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Spinner, Surface, useToast } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");
  const role = useQuery(api.users.getCurrentUserRole, isAuthenticated ? {} : "skip");

  const roleLabel = role === "admin" ? "Admin access enabled" : "Nurse access enabled";
  const userLabel = user?.name?.trim() || user?.email || "Signed-in user";

  return (
    <Container className="px-4 pb-4">
      <View className="flex-1 justify-between py-6">
        <View className="gap-6">
          <View className="items-center pt-8">
            <MediTagLogo size="sm" />
          </View>

          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-2">
              <Text className="text-xl font-semibold text-foreground">Welcome, {userLabel}</Text>
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
              <Text className="text-sm leading-6 text-muted">
                Open the scanner when you&apos;re ready to capture a patient wristband and continue
                through the medication check flow.
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
        </View>

        <Button
          testID="sign-out-button"
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
