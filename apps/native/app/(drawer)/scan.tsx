import { router } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

const scanChecklist = [
  "Request camera permission for QR scanning.",
  "Resolve the wristband to the patient record in Convex.",
  "Continue into medication selection and deterministic verification.",
] as const;

export default function ScanEntryScreen() {
  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-4">
        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-xl font-semibold text-foreground">Scan workflow entry</Text>
            <Text className="text-sm leading-6 text-muted">
              This route is the dedicated handoff into the nurse scanning experience. It keeps the
              prototype focused on the real bedside workflow instead of generic starter tabs.
            </Text>
          </View>
        </Surface>

        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-sm font-semibold uppercase tracking-wide text-primary">
              Next in the demo flow
            </Text>
            {scanChecklist.map((item) => (
              <View key={item} className="flex-row gap-3">
                <Text className="text-sm font-semibold text-primary">•</Text>
                <Text className="flex-1 text-sm leading-6 text-muted">{item}</Text>
              </View>
            ))}
          </View>
        </Surface>

        <Button
          onPress={() => {
            router.back();
          }}
        >
          <Button.Label>Back to workflow entry</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
