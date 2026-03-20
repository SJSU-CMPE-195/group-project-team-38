import { router } from "expo-router";
import { Button } from "heroui-native";
import { View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";

export default function WelcomeScreen() {
  return (
    <Container className="px-6" isScrollable={false}>
      <View className="flex-1 justify-center">
        <MediTagLogo />
      </View>

      <View className="pb-6">
        <Button
          testID="welcome-login-button"
          accessibilityLabel="Go to sign in"
          onPress={() => {
            router.push("/sign-in");
          }}
        >
          <Button.Label>Log In</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
