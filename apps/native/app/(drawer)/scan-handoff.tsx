import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, Surface } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";

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

  if (!scannedToken) {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">No wristband token</Text>
              <Text className="text-sm leading-6 text-muted">
                The medication selection step needs a captured QR wristband token before it can load
                patient context.
              </Text>
            </View>
          </Surface>

          <Button onPress={handleBackToScanner}>
            <Button.Label>Back to scanner</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Sign in required</Text>
              <Text className="text-sm leading-6 text-muted">
                Sign in again before loading patient context for a scanned wristband.
              </Text>
            </View>
          </Surface>

          <Button
            onPress={() => {
              router.replace("/");
            }}
          >
            <Button.Label>Back to workflow entry</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (scanContext === undefined) {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="flex-row items-center gap-3">
              <Spinner size="sm" color="default" />
              <Text className="text-sm text-muted">Loading patient context…</Text>
            </View>
          </Surface>

          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Scanned wristband token
              </Text>
              <Text className="text-sm leading-6 text-foreground">{scannedToken}</Text>
            </View>
          </Surface>
        </View>
      </Container>
    );
  }

  if (scanContext.status === "unknown_wristband") {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Unknown wristband</Text>
              <Text className="text-sm leading-6 text-muted">
                No patient record matches this QR wristband token. Scan again with a registered demo
                wristband.
              </Text>
            </View>
          </Surface>

          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Scanned wristband token
              </Text>
              <Text className="text-sm leading-6 text-foreground">{scannedToken}</Text>
            </View>
          </Surface>

          <Button onPress={handleBackToScanner}>
            <Button.Label>Scan another wristband</Button.Label>
          </Button>
          <Button onPress={handleBackToScanner}>
            <Button.Label>Back to scanner</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  if (scanContext.status === "inactive_wristband") {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Inactive wristband</Text>
              <Text className="text-sm leading-6 text-muted">
                This wristband has been deactivated and cannot be used for medication verification.
              </Text>
            </View>
          </Surface>

          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Wristband status
              </Text>
              <Text className="text-sm leading-6 text-foreground">
                Inactive wristband ID: {scanContext.wristbandId}
              </Text>
            </View>
          </Surface>

          <Button onPress={handleBackToScanner}>
            <Button.Label>Scan another wristband</Button.Label>
          </Button>
          <Button onPress={handleBackToScanner}>
            <Button.Label>Back to scanner</Button.Label>
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
          <View className="gap-4">
            <Surface variant="secondary" className="rounded-xl p-5">
              <View className="gap-3">
                <Text className="text-xl font-semibold text-foreground">Patient context ready</Text>
                <Text className="text-sm leading-6 text-muted">
                  Review the resolved patient and select one active medication from this patient
                  only.
                </Text>
              </View>
            </Surface>

            <Surface variant="secondary" className="rounded-xl p-5">
              <View className="gap-2">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Scanned wristband token
                </Text>
                <Text className="text-sm leading-6 text-foreground">{scannedToken}</Text>
              </View>
            </Surface>

            <Surface variant="secondary" className="rounded-xl p-5">
              <View className="gap-3">
                <Text className="text-base font-semibold text-foreground">Patient summary</Text>
                <View className="gap-2">
                  <Text className="text-sm text-foreground">
                    Patient name: {scanContext.patient.displayName}
                  </Text>
                  <Text className="text-sm text-foreground">MRN: {scanContext.patient.mrn}</Text>
                  <Text className="text-sm text-foreground">
                    Date of birth: {scanContext.patient.dob}
                  </Text>
                  <Text className="text-sm text-foreground">
                    Allergies:{" "}
                    {scanContext.patient.allergyLabels.length > 0
                      ? scanContext.patient.allergyLabels.join(", ")
                      : "No documented allergies"}
                  </Text>
                </View>
              </View>
            </Surface>

            {scanContext.medications.length === 0 ? (
              <Surface variant="secondary" className="rounded-xl p-5">
                <View className="gap-3">
                  <Text className="text-base font-semibold text-foreground">
                    No active medications
                  </Text>
                  <Text className="text-sm leading-6 text-muted">
                    This patient has no active medications available for selection right now.
                  </Text>
                  <Button onPress={handleBackToScanner}>
                    <Button.Label>Scan another wristband</Button.Label>
                  </Button>
                </View>
              </Surface>
            ) : (
              <Surface variant="secondary" className="rounded-xl p-5">
                <View className="gap-3">
                  <Text className="text-base font-semibold text-foreground">
                    Active medications
                  </Text>
                  <Text className="text-sm leading-6 text-muted">
                    Select exactly one active medication for {scanContext.patient.displayName}.
                  </Text>

                  <View className="gap-3">
                    {scanContext.medications.map((medication) => {
                      const isSelected = medication._id === selectedMedicationId;

                      return (
                        <Pressable
                          key={medication._id}
                          testID={`medication-option-${medication.rxNormCode}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Select medication ${medication.displayName}`}
                          onPress={() => {
                            setSelectedMedicationId(medication._id);
                          }}
                          className={`rounded-xl border p-4 ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-default-200 bg-background"
                          }`}
                        >
                          <View className="gap-2">
                            <View className="flex-row items-start justify-between gap-4">
                              <Text className="flex-1 text-sm font-semibold text-foreground">
                                {medication.displayName}
                              </Text>
                              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                                {isSelected ? "Selected medication" : "Tap to select"}
                              </Text>
                            </View>
                            <Text className="text-sm text-muted">
                              RxNorm code: {medication.rxNormCode}
                            </Text>
                            {medication.route ? (
                              <Text className="text-sm text-muted">Route: {medication.route}</Text>
                            ) : null}
                            {medication.dose ? (
                              <Text className="text-sm text-muted">Dose: {medication.dose}</Text>
                            ) : null}
                            {medication.frequency ? (
                              <Text className="text-sm text-muted">
                                Frequency: {medication.frequency}
                              </Text>
                            ) : null}
                            {isSelected ? (
                              <View className="mt-3 gap-3 rounded-xl bg-background px-4 py-4">
                                <View className="gap-1">
                                  <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                                    Ready to verify
                                  </Text>
                                  <Text className="text-sm leading-6 text-muted">
                                    Continue with this selected medication for deterministic
                                    verification.
                                  </Text>
                                </View>
                                <Pressable
                                  testID="continue-to-verification-button"
                                  accessibilityRole="button"
                                  accessibilityLabel="Continue to verification"
                                  onPress={() => {
                                    router.replace({
                                      pathname: "/(drawer)/verify",
                                      params: {
                                        wristbandToken: scannedToken,
                                        patientId: scanContext.patient._id,
                                        patientName: scanContext.patient.displayName,
                                        selectedMedicationId: medication._id,
                                        selectedMedicationName: medication.displayName,
                                      },
                                    });
                                  }}
                                  className="items-center rounded-xl bg-primary px-4 py-4"
                                >
                                  <Text className="text-sm font-semibold text-primary-foreground">
                                    Continue to verification
                                  </Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Surface>
            )}
          </View>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-default-200 bg-background px-4 pb-4 pt-3">
          <View className="gap-3">
            <Button onPress={handleBackToScanner}>
              <Button.Label>Scan another wristband</Button.Label>
            </Button>
            <Button onPress={handleBackToScanner}>
              <Button.Label>Back to scanner</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Container>
  );
}
