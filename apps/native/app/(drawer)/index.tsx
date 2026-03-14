import { api } from "@meditag/backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { Button, Chip, Separator, Spinner, Surface, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");

  const isConnected = healthCheck === "OK";
  const isLoading = healthCheck === undefined;

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 mb-5">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">
          Meditag
        </Text>
        <Text className="text-muted text-sm mt-1">Full-stack TypeScript starter</Text>
      </View>

      {user ? (
        <Surface variant="secondary" className="mb-4 p-4 rounded-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-medium">{user.name}</Text>
              <Text className="text-muted text-xs mt-0.5">{user.email}</Text>
            </View>
            <Button
              variant="danger"
              size="sm"
              onPress={() => {
                authClient.signOut();
              }}
            >
              Sign Out
            </Button>
          </View>
        </Surface>
      ) : null}
      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-2">API Status</Text>
        <View className="flex-row items-center gap-2">
          <View
            className={`w-2 h-2 rounded-full ${healthCheck === "OK" ? "bg-success" : "bg-danger"}`}
          />
          <Text className="text-muted text-xs">
            {healthCheck === undefined
              ? "Checking..."
              : healthCheck === "OK"
                ? "Connected to API"
                : "API Disconnected"}
          </Text>
        </View>
      </Surface>
      {!user && (
        <View className="mt-5 gap-4">
          <SignIn />
          <SignUp />
        </View>
      )}
    </Container>
  );
}
