import { Redirect, Stack, router } from "expo-router";
import { Button } from "heroui-native";
import { useConvexAuth } from "convex/react";
import { View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";
import { SignUp } from "@/components/sign-up";

export default function SignUpScreen() {
  const { isAuthenticated } = useConvexAuth();

  if (isAuthenticated) {
    return <Redirect href="/(drawer)" />;
  }

  return (
    <Container className="px-4 pb-4">
      <Stack.Screen options={{ title: "Create Account" }} />

      <View className="gap-6 py-6">
        <View className="items-center pt-4">
          <MediTagLogo size="sm" />
        </View>

        <SignUp />

        <Button
          variant="secondary"
          onPress={() => {
            router.replace("/sign-in");
          }}
        >
          <Button.Label>Back to sign in</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
