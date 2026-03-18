import { router, useLocalSearchParams } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

export default function ScanHandoffScreen() {
  const { wristbandToken } = useLocalSearchParams<{ wristbandToken?: string }>();

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-4">
        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-xl font-semibold text-foreground">Token handoff ready</Text>
            <Text className="text-sm leading-6 text-muted">
              This placeholder route proves the scan shell can hand a captured QR token forward
              without keeping the camera mounted. Medication selection and verification plug into
              this handoff next.
            </Text>
          </View>
        </Surface>

        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
              Wristband token
            </Text>
            <Text className="text-sm leading-6 text-foreground">
              {wristbandToken ?? "No wristband token was provided."}
            </Text>
          </View>
        </Surface>

        <Button
          onPress={() => {
            router.back();
          }}
        >
          <Button.Label>Back to scanner</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
