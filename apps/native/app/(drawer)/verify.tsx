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
  const requestScanLogExplanation = useMutation(api.scanLogExplanations.requestScanLogExplanation);

  const wristbandToken = getRouteParam(params.wristbandToken);
  const patientId = getRouteParam(params.patientId);
  const patientName = getRouteParam(params.patientName);
  const selectedMedicationIdParam = getRouteParam(params.selectedMedicationId);
  const selectedMedicationName = getRouteParam(params.selectedMedicationName);
  const scanContext = useQuery(
    api.verification.getScanContext,
    isAuthenticated && wristbandToken ? { scannedToken: wristbandToken } : "skip",
  );
  const selectedMedication =
    scanContext?.status === "resolved"
      ? (scanContext.medications.find(
          (medication) => medication._id === selectedMedicationIdParam,
        ) ?? null)
      : null;
  const selectedMedicationId = selectedMedication?._id;

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

  const effectiveExplanationStatus =
    explanationLog?.explanationStatus ?? verificationResult?.explanationStatus ?? null;
  const explanationText = explanationLog?.explanationText;

  const runVerification = async () => {
    if (!wristbandToken || !selectedMedicationId) {
      return;
    }

    setActionError(null);
    setIsSubmittingVerification(true);
    setExplanationScanLogId(null);

    try {
      const result = await verifyMedicationScan({
        scannedToken: wristbandToken,
        selectedMedicationId,
        scanType: "qr",
        requestExplanation: false,
        deviceId: "native-app",
      });

      setVerificationResult(result);
      setExplanationScanLogId(result.result === "fail" ? result.scanLogId : null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const requestExplanation = async () => {
    if (!verificationResult || verificationResult.result !== "fail") {
      return;
    }

    setActionError(null);
    setIsRequestingExplanation(true);

    try {
      const result = await requestScanLogExplanation({
        scanLogId: verificationResult.scanLogId,
      });

      setVerificationResult((current) => {
        if (!current || current.scanLogId !== result.scanLogId) {
          return current;
        }

        return {
          ...current,
          explanationStatus: result.explanationStatus,
        };
      });
      setExplanationScanLogId(result.scanLogId);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsRequestingExplanation(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="px-4 pb-4">
        <View className="py-6 gap-4">
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Sign in required</Text>
              <Text className="text-sm leading-6 text-muted">Sign in to continue.</Text>
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
            <Text testID="verify-screen-title" className="text-xl font-semibold text-foreground">
              Review and verify
            </Text>
            <Text className="text-sm leading-6 text-muted">
              Confirm the selected patient and medication before running the bedside check.
            </Text>
          </View>
        </Surface>

        <Surface variant="secondary" className="rounded-2xl p-5">
          <View className="gap-4">
            <Text className="text-base font-semibold text-foreground">Verification summary</Text>
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Patient
              </Text>
              <Text className="text-sm leading-6 text-foreground">
                {patientName ?? "Unknown patient"}
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Medication
              </Text>
              <Text className="text-sm leading-6 text-foreground">
                {selectedMedication?.displayName ??
                  selectedMedicationName ??
                  "No medication selected"}
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Wristband token
              </Text>
              <Text className="text-sm leading-6 text-foreground">
                {wristbandToken ?? "Missing wristband token"}
              </Text>
            </View>
            {patientId ? (
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Patient ID
                </Text>
                <Text className="text-sm leading-6 text-foreground">{patientId}</Text>
              </View>
            ) : null}
          </View>
        </Surface>

        {!canVerify ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                Verification cannot start yet
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Required scan details are missing.
              </Text>
            </View>
          </Surface>
        ) : null}

        <Button
          testID="run-deterministic-verification-button"
          accessibilityLabel="Run deterministic verification"
          onPress={() => void runVerification()}
          isDisabled={!canVerify || isSubmittingVerification || isRequestingExplanation}
        >
          {isSubmittingVerification ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Run verification</Button.Label>
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
            className={`rounded-2xl border p-5 ${
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
                  {verificationResult.result === "pass" ? "PASS" : "FAIL"}
                </Text>
              </View>

              {verificationResult.result === "pass" ? (
                <Text className="text-sm leading-6 text-foreground">
                  The medication matches the patient record and no allergy conflict was found.
                </Text>
              ) : (
                <View className="gap-3">
                  <Text className="text-sm leading-6 text-foreground">
                    Do not administer until the issues below are resolved.
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
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  AI explanation
                </Text>
                <Text className="text-base font-semibold text-foreground">More detail</Text>
              </View>
              <Text className="text-sm leading-6 text-muted">
                You can request additional context for this result.
              </Text>

              {effectiveExplanationStatus === "none" || effectiveExplanationStatus === "failed" ? (
                <Button
                  testID="request-ai-explanation-button"
                  accessibilityLabel="Request AI explanation"
                  onPress={() => void requestExplanation()}
                  isDisabled={isSubmittingVerification || isRequestingExplanation}
                >
                  {isRequestingExplanation ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Button.Label>
                      {effectiveExplanationStatus === "failed"
                        ? "Try AI explanation again"
                        : "Request AI explanation"}
                    </Button.Label>
                  )}
                </Button>
              ) : null}

              {explanationScanLogId && effectiveExplanationStatus !== "none" ? (
                <View className="gap-3 rounded-xl bg-background px-4 py-4">
                  <Text className="text-sm font-semibold text-foreground">
                    AI explanation requested
                  </Text>
                  <View className="gap-1">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Explanation request status
                    </Text>
                    <Text className="text-sm text-foreground">
                      {effectiveExplanationStatus ?? "Loading…"}
                    </Text>
                  </View>

                  {effectiveExplanationStatus === "requested" || !effectiveExplanationStatus ? (
                    <View className="flex-row items-center gap-3">
                      <Spinner size="sm" color="default" />
                      <Text className="flex-1 text-sm leading-6 text-muted">
                        Generating explanation…
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
                    <View className="gap-2">
                      <Text className="text-sm leading-6 text-muted">
                        Explanation could not be generated.
                      </Text>
                      {explanationText ? (
                        <Text className="text-sm leading-6 text-foreground">{explanationText}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Surface>
        ) : null}

        <Button
          variant="secondary"
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
