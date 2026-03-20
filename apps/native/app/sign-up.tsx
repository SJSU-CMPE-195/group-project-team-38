import { Redirect, Stack, router } from "expo-router";
import { Button, Surface } from "heroui-native";
import { useConvexAuth } from "convex/react";
import { Text, View } from "react-native";

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

      <View className="flex-1 justify-between py-6">
        <View className="gap-6">
          <View className="items-center pt-4">
            <MediTagLogo size="sm" />
          </View>

          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-2">
              <Text className="text-xl font-semibold text-foreground">Create your account</Text>
              <Text className="text-sm leading-6 text-muted">
                Set up your MediTag login to access the nurse workflow.
              </Text>
            </View>
          </Surface>

          <SignUp />
        </View>

        <Button
          variant="secondary"
          onPress={() => {
            router.replace("/sign-in");
          }}
        >
          <Button.Label>Already have an account? Log in</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
