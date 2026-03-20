import { Redirect, Stack, router } from "expo-router";
import { Button } from "heroui-native";
import { useConvexAuth } from "convex/react";
import { View } from "react-native";

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

          <SignIn />
        </View>

        <Button
          variant="secondary"
          onPress={() => {
            router.push("/sign-up");
          }}
        >
          <Button.Label>Don&apos;t have an account? Click here</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
