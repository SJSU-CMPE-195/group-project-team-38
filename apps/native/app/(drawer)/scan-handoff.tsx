import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, Surface } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";

type MedicationSelection = {
  _id: Id<"medications">;
  displayName: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

function getRouteParam(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0];
}

export default function ScanHandoffScreen() {
  const params = useLocalSearchParams<{ wristbandToken?: string | string[] }>();
  const { isAuthenticated } = useConvexAuth();
  const scannedToken = getRouteParam(params.wristbandToken);
  const scanContext = useQuery(
    api.verification.getScanContext,
    isAuthenticated && scannedToken ? { scannedToken } : "skip",
  );
  const [selectedMedicationId, setSelectedMedicationId] = useState<Id<"medications"> | null>(null);
  const selectedMedication =
    scanContext?.status === "resolved"
      ? (scanContext.medications.find((medication) => medication._id === selectedMedicationId) ??
        null)
      : null;

  useEffect(() => {
    if (scanContext?.status !== "resolved") {
      setSelectedMedicationId(null);
      return;
    }

    setSelectedMedicationId((currentSelection) => {
      if (
        currentSelection &&
        scanContext.medications.some((medication) => medication._id === currentSelection)
      ) {
        return currentSelection;
      }

      return null;
    });
  }, [scanContext]);

  const handleBackToScanner = () => {
    router.replace("/(drawer)/scan");
  };

  const handleContinueToVerification = () => {
    if (!scannedToken || !selectedMedication || scanContext?.status !== "resolved") {
      return;
    }

    const verifyParams = new URLSearchParams();
    verifyParams.set("wristbandToken", scannedToken);
    verifyParams.set("patientId", scanContext.patient._id);
    verifyParams.set("patientName", scanContext.patient.displayName);
    verifyParams.set("selectedMedicationId", selectedMedication._id);
    verifyParams.set("selectedMedicationName", selectedMedication.displayName);

    router.push(`./verify?${verifyParams.toString()}`);
  };

  const handleSelectMedication = (medication: MedicationSelection) => {
    setSelectedMedicationId(medication._id);
  };

  if (!scannedToken) {
    return (
      <Container className="px-6">
        <View className="py-6 gap-5">
          <View className="gap-2">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              No wristband scanned
            </Text>
            <Text className="text-base leading-7 text-muted">Scan a wristband to continue.</Text>
          </View>
          <Button onPress={handleBackToScanner}>
            <Button.Label>Return to scanner</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="px-6">
        <View className="py-6 gap-5">
          <View className="gap-2">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in required
            </Text>
            <Text className="text-base leading-7 text-muted">Sign in to continue.</Text>
          </View>
          <Button
            onPress={() => {
              router.replace("/");
            }}
          >
            <Button.Label>Go to sign in</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (scanContext === undefined) {
    return (
      <Container className="px-6">
        <View className="flex-1 items-center justify-center gap-3 py-12">
          <Spinner size="sm" color="default" />
          <Text className="text-sm text-muted">Loading patient record…</Text>
        </View>
      </Container>
    );
  }

  if (scanContext.status === "unknown_wristband") {
    return (
      <Container className="px-6">
        <View className="py-6 gap-5">
          <View className="gap-2">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              Unknown wristband
            </Text>
            <Text className="text-base leading-7 text-muted">
              No patient record matches this wristband.
            </Text>
          </View>
          <Button onPress={handleBackToScanner}>
            <Button.Label>Scan another wristband</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (scanContext.status === "inactive_wristband") {
    return (
      <Container className="px-6">
        <View className="py-6 gap-5">
          <View className="gap-2">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              Inactive wristband
            </Text>
            <Text className="text-base leading-7 text-muted">
              This wristband has been deactivated and can&apos;t be used for verification.
            </Text>
          </View>
          <Button onPress={handleBackToScanner}>
            <Button.Label>Scan another wristband</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <Container isScrollable={false}>
      <View className="flex-1">
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 180 }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="gap-6">
            <View className="gap-2">
              <Text
                testID="scan-handoff-screen-title"
                className="text-3xl font-semibold tracking-tight text-foreground"
              >
                Select medication
              </Text>
            </View>

            <Surface variant="secondary" className="rounded-2xl border border-border p-5">
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">
                  {scanContext.patient.displayName}
                </Text>
                <View className="gap-2">
                  <DetailRow label="MRN" value={scanContext.patient.mrn} />
                  <DetailRow label="DOB" value={scanContext.patient.dob} />
                  <DetailRow
                    label="Allergies"
                    value={
                      scanContext.patient.allergyLabels.length > 0
                        ? scanContext.patient.allergyLabels.join(", ")
                        : "None recorded"
                    }
                  />
                </View>
              </View>
            </Surface>

            {scanContext.medications.length === 0 ? (
              <Surface variant="secondary" className="rounded-2xl border border-border p-5">
                <View className="gap-3">
                  <Text className="text-base font-semibold text-foreground">
                    No active medications
                  </Text>
                  <Button variant="secondary" onPress={handleBackToScanner}>
                    <Button.Label>Scan another wristband</Button.Label>
                  </Button>
                </View>
              </Surface>
            ) : (
              <View className="gap-3">
                <Text className="text-sm font-medium text-muted">Medication</Text>

                <View className="gap-2">
                  {scanContext.medications.map((medication) => {
                    const isSelected = medication._id === selectedMedicationId;
                    const meta = [medication.dose, medication.route, medication.frequency]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <Pressable
                        key={medication._id}
                        testID={`medication-option-${medication.rxNormCode}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Select medication ${medication.displayName}`}
                        onPress={() => {
                          handleSelectMedication(medication);
                        }}
                        className={`rounded-2xl border p-4 ${
                          isSelected
                            ? "border-accent bg-accent-soft"
                            : "border-border bg-background"
                        }`}
                      >
                        <View className="gap-1">
                          <Text className="text-base font-semibold text-foreground">
                            {medication.displayName}
                          </Text>
                          {meta ? <Text className="text-sm text-muted">{meta}</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-6 pb-6 pt-4">
          <View className="gap-2">
            {selectedMedication ? (
              <Button
                testID="continue-to-verification-button"
                accessibilityLabel="Continue to verification"
                onPress={handleContinueToVerification}
              >
                <Button.Label>Continue with {selectedMedication.displayName}</Button.Label>
              </Button>
            ) : null}
            <Button variant="tertiary" onPress={handleBackToScanner}>
              <Button.Label>Scan another wristband</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Container>
  );
}
