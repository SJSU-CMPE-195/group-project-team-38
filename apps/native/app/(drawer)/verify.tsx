import { router, useLocalSearchParams } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

function getRouteParam(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0];
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    wristbandToken?: string | string[];
    patientId?: string | string[];
    patientName?: string | string[];
    selectedMedicationId?: string | string[];
    selectedMedicationName?: string | string[];
  }>();

  const wristbandToken = getRouteParam(params.wristbandToken);
  const patientId = getRouteParam(params.patientId);
  const patientName = getRouteParam(params.patientName);
  const selectedMedicationId = getRouteParam(params.selectedMedicationId);
  const selectedMedicationName = getRouteParam(params.selectedMedicationName);

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-4">
        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-xl font-semibold text-foreground">
              Verification handoff ready
            </Text>
            <Text className="text-sm leading-6 text-muted">
              The patient context and medication selection are now captured locally and ready for
              the verification mutation to plug in next.
            </Text>
          </View>
        </Surface>

        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Verification summary</Text>
            <Text className="text-sm text-foreground">
              Patient name: {patientName ?? "Unknown patient"}
            </Text>
            <Text className="text-sm text-foreground">
              Patient ID: {patientId ?? "Missing patient ID"}
            </Text>
            <Text className="text-sm text-foreground">
              Selected medication: {selectedMedicationName ?? "No medication selected"}
            </Text>
            <Text className="text-sm text-foreground">
              Selected medication ID: {selectedMedicationId ?? "Missing medication ID"}
            </Text>
            <Text className="text-sm text-foreground">
              Wristband token: {wristbandToken ?? "Missing wristband token"}
            </Text>
          </View>
        </Surface>

        <Button
          onPress={() => {
            router.back();
          }}
        >
          <Button.Label>Back to medication selection</Button.Label>
        </Button>
        <Button
          onPress={() => {
            router.replace("/(drawer)/scan");
          }}
        >
          <Button.Label>Scan another wristband</Button.Label>
        </Button>
      </View>
    </Container>
  );
}
