import { api } from "@meditag/backend/convex/_generated/api";
import type { Id } from "@meditag/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, Surface } from "heroui-native";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

const failureReasonCopy = {
  identity_mismatch: {
    label: "Medication does not belong to this patient",
    description:
      "The selected medication is assigned to a different patient record than the scanned wristband.",
  },
  allergy_conflict: {
    label: "Recorded allergy conflict",
    description:
      "The selected medication conflicts with at least one allergy already recorded for this patient.",
  },
  wristband_not_found: {
    label: "Wristband token not recognized",
    description: "The scanned wristband token does not map to an active patient wristband.",
  },
  medication_not_found: {
    label: "Medication could not be resolved",
    description:
      "The selected medication is missing or inactive, so verification could not confirm a safe match.",
  },
} as const;

type FailureReason = keyof typeof failureReasonCopy;

type VerificationResult = {
  result: "pass" | "fail";
  failureReasons: FailureReason[];
  patientId?: Id<"patients">;
  medicationId?: Id<"medications">;
  scanLogId: Id<"scanLogs">;
  explanationStatus: "none" | "requested" | "generated" | "failed";
};

function getRouteParam(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Something went wrong while contacting the verification service.";
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    wristbandToken?: string | string[];
    patientId?: string | string[];
    patientName?: string | string[];
    selectedMedicationId?: string | string[];
    selectedMedicationName?: string | string[];
  }>();
  const { isAuthenticated } = useConvexAuth();
  const verifyMedicationScan = useMutation(api.verification.verifyMedicationScan);

  const wristbandToken = getRouteParam(params.wristbandToken);
  const patientId = getRouteParam(params.patientId);
  const patientName = getRouteParam(params.patientName);
  const selectedMedicationId = getRouteParam(params.selectedMedicationId) as
    | Id<"medications">
    | undefined;
  const selectedMedicationName = getRouteParam(params.selectedMedicationName);

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [explanationScanLogId, setExplanationScanLogId] = useState<Id<"scanLogs"> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isRequestingExplanation, setIsRequestingExplanation] = useState(false);

  const canVerify = Boolean(wristbandToken && selectedMedicationId);
  const explanationLogs = useQuery(
    api.verification.getRecentScanLogs,
    isAuthenticated && explanationScanLogId ? { limit: 25 } : "skip",
  );

  const explanationLog = useMemo(() => {
    if (!explanationScanLogId || !explanationLogs) {
      return null;
    }

    return explanationLogs.find((log) => log._id === explanationScanLogId) ?? null;
  }, [explanationLogs, explanationScanLogId]);

  const effectiveExplanationStatus = explanationLog?.explanationStatus ?? null;
  const explanationText = explanationLog?.explanationText;

  const runVerification = async (requestExplanation: boolean) => {
    if (!wristbandToken || !selectedMedicationId) {
      return;
    }

    setActionError(null);

    if (requestExplanation) {
      setIsRequestingExplanation(true);
    } else {
      setIsSubmittingVerification(true);
      setExplanationScanLogId(null);
    }

    try {
      const result = await verifyMedicationScan({
        scannedToken: wristbandToken,
        selectedMedicationId,
        scanType: "qr",
        requestExplanation,
        deviceId: "native-app",
      });

      setVerificationResult(result);

      if (requestExplanation) {
        setExplanationScanLogId(result.scanLogId);
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      if (requestExplanation) {
        setIsRequestingExplanation(false);
      } else {
        setIsSubmittingVerification(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Sign in required</Text>
              <Text className="text-sm leading-6 text-muted">
                Sign in again before running deterministic medication verification.
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

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-4">
        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-xl font-semibold text-foreground">
              Deterministic medication verification
            </Text>
            <Text className="text-sm leading-6 text-muted">
              Review the captured scan inputs, run the deterministic check first, and only request
              AI explanation text after a failed result if supporting context is needed.
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

        {!canVerify ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                Verification cannot start yet
              </Text>
              <Text className="text-sm leading-6 text-muted">
                The verify screen is missing either the scanned wristband token or the selected
                medication ID.
              </Text>
            </View>
          </Surface>
        ) : null}

        <Button
          onPress={() => void runVerification(false)}
          isDisabled={!canVerify || isSubmittingVerification || isRequestingExplanation}
        >
          {isSubmittingVerification ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Run deterministic verification</Button.Label>
          )}
        </Button>

        {actionError ? (
          <Surface variant="secondary" className="rounded-xl border border-danger/40 p-5">
            <View className="gap-2">
              <Text className="text-base font-semibold text-danger">
                Verification request failed
              </Text>
              <Text className="text-sm leading-6 text-muted">{actionError}</Text>
            </View>
          </Surface>
        ) : null}

        {verificationResult ? (
          <Surface
            variant="secondary"
            className={`rounded-xl border p-5 ${
              verificationResult.result === "pass"
                ? "border-success/40 bg-success/10"
                : "border-danger/40 bg-danger/10"
            }`}
          >
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Deterministic verification result
                </Text>
                <Text
                  className={`text-2xl font-semibold ${
                    verificationResult.result === "pass" ? "text-success" : "text-danger"
                  }`}
                >
                  {verificationResult.result === "pass"
                    ? "PASS — Safe to proceed"
                    : "FAIL — Do not administer"}
                </Text>
              </View>

              {verificationResult.result === "pass" ? (
                <Text className="text-sm leading-6 text-foreground">
                  The selected medication matches the scanned patient context and no deterministic
                  allergy conflict was found.
                </Text>
              ) : (
                <View className="gap-3">
                  <Text className="text-sm leading-6 text-foreground">
                    Deterministic checks found one or more blocking issues. Review each rationale
                    below before taking any next step.
                  </Text>
                  <View className="gap-3">
                    {verificationResult.failureReasons.map((reason) => {
                      const copy = failureReasonCopy[reason];

                      return (
                        <View key={reason} className="rounded-xl bg-background/80 p-4 gap-1">
                          <Text className="text-sm font-semibold text-foreground">
                            {copy.label}
                          </Text>
                          <Text className="text-sm leading-6 text-muted">{copy.description}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </Surface>
        ) : null}

        {verificationResult?.result === "fail" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Secondary AI explanation
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  Optional supporting context only
                </Text>
              </View>
              <Text className="text-sm leading-6 text-muted">
                The deterministic fail result above remains the final authority. AI text can only
                explain the structured failure reasons already detected by the backend.
              </Text>

              {!explanationScanLogId ? (
                <Button
                  onPress={() => void runVerification(true)}
                  isDisabled={isSubmittingVerification || isRequestingExplanation}
                >
                  {isRequestingExplanation ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Button.Label>Request AI explanation</Button.Label>
                  )}
                </Button>
              ) : null}

              {explanationScanLogId ? (
                <View className="gap-3 rounded-xl bg-background px-4 py-4">
                  <Text className="text-sm font-semibold text-foreground">
                    Explanation request status: {effectiveExplanationStatus ?? "Loading…"}
                  </Text>

                  {effectiveExplanationStatus === "requested" || !effectiveExplanationStatus ? (
                    <View className="flex-row items-center gap-3">
                      <Spinner size="sm" color="default" />
                      <Text className="flex-1 text-sm leading-6 text-muted">
                        Waiting for the backend to generate optional explanation text for this
                        failed result.
                      </Text>
                    </View>
                  ) : null}

                  {effectiveExplanationStatus === "generated" ? (
                    <View className="gap-2">
                      <Text className="text-sm font-semibold text-foreground">
                        AI explanation text
                      </Text>
                      <Text className="text-sm leading-6 text-foreground">
                        {explanationText ?? "Explanation text was not returned."}
                      </Text>
                    </View>
                  ) : null}

                  {effectiveExplanationStatus === "failed" ? (
                    <Text className="text-sm leading-6 text-muted">
                      The optional AI explanation could not be generated. Keep using the
                      deterministic fail reasons above as the authoritative guidance.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Surface>
        ) : null}

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
