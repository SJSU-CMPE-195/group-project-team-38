import { router } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { MediTagLogo } from "@/components/meditag-logo";

export default function WelcomeScreen() {
  return (
    <Container className="px-6 pb-6" isScrollable={false}>
      <View className="flex-1 justify-between py-10">
        <View className="flex-1 items-center justify-center gap-8">
          <MediTagLogo />
          <View className="gap-3">
            <Text className="text-center text-3xl font-semibold tracking-tight text-foreground">
              Safer medication checks
            </Text>
            <Text className="text-center text-base leading-7 text-muted">
              Scan the patient wristband, confirm the medication, and review a clear pass or fail
              result before administration.
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-center text-sm uppercase tracking-[2px] text-primary">
            Nurse demo workflow
          </Text>
          <Button
            testID="welcome-login-button"
            accessibilityLabel="Go to sign in"
            onPress={() => {
              router.push("/sign-in");
            }}
          >
            <Button.Label>Continue</Button.Label>
          </Button>
        </View>
      </View>
    </Container>
  );
}
