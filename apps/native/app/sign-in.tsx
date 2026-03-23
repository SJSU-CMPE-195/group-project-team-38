import { Redirect, Stack, router } from "expo-router";
import { Button, Surface } from "heroui-native";
import { useConvexAuth } from "convex/react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";
import { SignIn } from "@/components/sign-in";

export default function SignInScreen() {
  const { isAuthenticated } = useConvexAuth();

  if (isAuthenticated) {
    return <Redirect href="/(drawer)" />;
  }

  return (
    <Container className="px-4 pb-4">
      <Stack.Screen options={{ title: "Log In" }} />

      <View className="flex-1 justify-between py-6">
        <View className="gap-6">
          <View className="items-center pt-4">
            <MediTagLogo size="sm" />
          </View>

          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-2">
              <Text className="text-2xl font-semibold tracking-tight text-foreground">
                Sign in to start a verification
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Keep the flow simple: sign in, scan the wristband, choose the medication, and review
                the bedside result.
              </Text>
            </View>
          </Surface>

          <SignIn />
        </View>

        <Button
          variant="secondary"
          onPress={() => {
            router.push("/sign-up");
          }}
        >
          <Button.Label>Create an account</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
