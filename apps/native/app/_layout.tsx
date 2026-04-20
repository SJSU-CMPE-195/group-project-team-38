import "@/global.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@meditag/env/native";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { router, Stack, useSegments } from "expo-router";
import { HeroUINativeProvider, Spinner } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { Container } from "@/components/container";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";

export const unstable_settings = {
  initialRouteName: "index",
};

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

function StackLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const segments = useSegments();
  const isInAuthenticatedGroup = segments[0] === "(drawer)";
  const isInGuestFlow =
    segments[0] === undefined || segments[0] === "sign-in" || segments[0] === "sign-up";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && !isInAuthenticatedGroup) {
      router.replace("/(drawer)");
      return;
    }

    if (!isAuthenticated && isInAuthenticatedGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, isInAuthenticatedGroup, isLoading]);

  if (isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color="default" />
        </View>
      </Container>
    );
  }

  return (
    <Stack screenOptions={{}}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: isAuthenticated && isInGuestFlow ? "none" : "default",
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          title: "Log In",
          headerBackTitle: " ",
          headerBackButtonDisplayMode: "minimal",
          animation: isAuthenticated && isInGuestFlow ? "none" : "default",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Create Account",
          headerBackTitle: " ",
          headerBackButtonDisplayMode: "minimal",
          animation: isAuthenticated && isInGuestFlow ? "none" : "default",
        }}
      />
      <Stack.Screen
        name="(drawer)"
        options={{
          headerShown: false,
          animation: !isAuthenticated && isInAuthenticatedGroup ? "none" : "default",
        }}
      />
      <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <StackLayout />
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ConvexBetterAuthProvider>
  );
}
