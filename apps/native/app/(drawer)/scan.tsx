import * as Haptics from "expo-haptics";
import {
  CameraView,
  type BarcodeScanningResult,
  type CameraMountError,
  useCameraPermissions,
} from "expo-camera";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Button, Spinner, Surface } from "heroui-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import {
  decodeFirstWristbandToken,
  isValidWristbandToken,
  normalizeWristbandToken,
} from "@/lib/nfc";

const simulatorDemoWristbands = [
  {
    label: "Use safe demo wristband",
    description: "Loads Demo Safe Patient with Acetaminophen 500mg for the pass path.",
    token: "WRISTBAND-SAFE-QR-001",
  },
  {
    label: "Use conflict demo wristband",
    description: "Loads Demo Conflict Patient with Amoxicillin 500mg for the fail path.",
    token: "WRISTBAND-CONFLICT-QR-001",
  },
] as const;

type ScanMode = "qr" | "nfc";

type NfcModule = typeof import("react-native-nfc-manager");

const nfcSupportsPlatform = Platform.OS === "ios";

let cachedNfc: NfcModule | null = null;

function loadNfc(): NfcModule | null {
  if (!nfcSupportsPlatform) {
    return null;
  }
  if (!cachedNfc) {
    cachedNfc = require("react-native-nfc-manager") as NfcModule;
  }
  return cachedNfc;
}

export default function ScanEntryScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("qr");
  const isIosSimulator = Platform.OS === "ios" && !Constants.isDevice;

  const scanState = useMemo(() => {
    if (scannedToken) {
      return "captured";
    }

    if (scanMode === "nfc") {
      return "nfc";
    }

    if (isIosSimulator) {
      return "simulator-demo";
    }

    if (!permission) {
      return "loading-permission";
    }

    if (!permission.granted) {
      return permission.canAskAgain ? "permission-required" : "permission-denied";
    }

    if (cameraError) {
      return "camera-error";
    }

    return "scanning";
  }, [cameraError, isIosSimulator, permission, scanMode, scannedToken]);

  const handleRequestPermission = async () => {
    const response = await requestPermission();

    if (!response.granted && !response.canAskAgain) {
      setCameraError(null);
    }
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    const token = data.trim();

    if (!token || scannedToken) {
      return;
    }

    setScannedToken(token);
    setCameraError(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleScanAgain = () => {
    setScannedToken(null);
    setCameraError(null);
  };

  const handleUseDemoWristband = (token: string) => {
    setScannedToken(token);
    setCameraError(null);
  };

  const handleCameraError = ({ message }: CameraMountError) => {
    setCameraError(message);
  };

  const handleNfcCapture = useCallback((token: string) => {
    setScannedToken(token);
    setCameraError(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Container className="px-6 pb-6">
      <View className="py-8 gap-6">
        <View className="gap-2">
          <Text
            testID="scan-screen-title"
            className="text-3xl font-semibold tracking-tight text-foreground"
          >
            Scan patient wristband
          </Text>
          <Text className="text-base leading-7 text-muted">
            {scanMode === "nfc"
              ? "Hold the wristband against the back of the device."
              : "Hold the wristband QR code in the camera frame."}
          </Text>
        </View>

        {!scannedToken ? <ScanModeToggle mode={scanMode} onChange={setScanMode} /> : null}

        {scanState === "simulator-demo" ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                Simulator demo wristbands
              </Text>
              <Text className="text-sm leading-6 text-muted">
                Pick a sample patient to continue without the camera.
              </Text>
              <View className="gap-2 pt-1">
                {simulatorDemoWristbands.map((fixture) => (
                  <Button
                    key={fixture.token}
                    testID={`demo-wristband-${fixture.token}`}
                    accessibilityLabel={fixture.label}
                    variant="secondary"
                    onPress={() => handleUseDemoWristband(fixture.token)}
                  >
                    <Button.Label>{fixture.label}</Button.Label>
                  </Button>
                ))}
              </View>
            </View>
          </Surface>
        ) : null}

        {scanState === "loading-permission" ? (
          <View className="flex-row items-center justify-center gap-3 py-8">
            <Spinner size="sm" color="default" />
            <Text className="text-sm text-muted">Checking camera permission…</Text>
          </View>
        ) : null}

        {scanState === "permission-required" ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Camera access needed</Text>
              <Text className="text-sm leading-6 text-muted">
                Allow camera access to scan wristband QR codes.
              </Text>
              <Button onPress={handleRequestPermission}>
                <Button.Label>Allow camera access</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "permission-denied" ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Camera access denied</Text>
              <Text className="text-sm leading-6 text-muted">
                Re-enable camera access in Settings, then return to scan.
              </Text>
              <Button
                variant="secondary"
                onPress={() => {
                  router.back();
                }}
              >
                <Button.Label>Go back</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "camera-error" ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Scanner unavailable</Text>
              <Text className="text-sm leading-6 text-muted">
                {cameraError ?? "The camera preview could not start."}
              </Text>
              <Button onPress={handleScanAgain}>
                <Button.Label>Try again</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "scanning" ? (
          <View className="gap-3">
            <View className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: 3 / 4 }}>
              <CameraView
                facing="back"
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
                onMountError={handleCameraError}
              />
            </View>
            <Text className="text-center text-sm text-muted">
              Scanning stops automatically after capture.
            </Text>
          </View>
        ) : null}

        {scanState === "nfc" ? (
          <NfcPanel onCapture={handleNfcCapture} isIosSimulator={isIosSimulator} />
        ) : null}

        {scanState === "captured" && scannedToken ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-4">
              <Text className="text-xl font-semibold text-foreground">Wristband captured</Text>
              <Text className="text-sm leading-6 text-muted">
                Continue to confirm the patient and select a medication.
              </Text>
              <View className="gap-2 pt-1">
                <Button
                  testID="continue-with-wristband-button"
                  accessibilityLabel="Continue with this wristband"
                  onPress={() => {
                    const handoffParams = new URLSearchParams({
                      wristbandToken: scannedToken,
                    });

                    router.push(`./scan-handoff?${handoffParams.toString()}`);
                  }}
                >
                  <Button.Label>Continue</Button.Label>
                </Button>
                <Button variant="tertiary" onPress={handleScanAgain}>
                  <Button.Label>Scan again</Button.Label>
                </Button>
              </View>
            </View>
          </Surface>
        ) : null}

        <Button
          variant="tertiary"
          onPress={() => {
            router.back();
          }}
        >
          <Button.Label>Back</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

function ScanModeToggle({
  mode,
  onChange,
}: {
  mode: ScanMode;
  onChange: (next: ScanMode) => void;
}) {
  const options: Array<{ id: ScanMode; label: string }> = [
    { id: "qr", label: "QR" },
    { id: "nfc", label: "NFC" },
  ];

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row gap-2 rounded-2xl border border-default-200 bg-background p-1"
    >
      {options.map((option) => {
        const isSelected = option.id === mode;
        return (
          <Pressable
            key={option.id}
            testID={`scan-mode-${option.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Switch to ${option.label} scan mode`}
            onPress={() => onChange(option.id)}
            className={`flex-1 items-center rounded-xl px-3 py-2 ${
              isSelected ? "bg-primary/10" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-muted"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type NfcStatus =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "writing" }
  | { kind: "error"; message: string }
  | { kind: "wrote"; token: string };

function NfcPanel({
  onCapture,
  isIosSimulator,
}: {
  onCapture: (token: string) => void;
  isIosSimulator: boolean;
}) {
  const nfc = useMemo(() => (isIosSimulator ? null : loadNfc()), [isIosSimulator]);
  const [status, setStatus] = useState<NfcStatus>({ kind: "idle" });
  const [showWriter, setShowWriter] = useState(false);
  const [writeToken, setWriteToken] = useState("");
  const sessionActiveRef = useRef(false);

  useEffect(() => {
    if (!nfc) {
      return;
    }
    void nfc.default.start().catch(() => {
      setStatus({ kind: "error", message: "NFC is not available on this device." });
    });
    return () => {
      if (sessionActiveRef.current) {
        sessionActiveRef.current = false;
        void nfc.default.cancelTechnologyRequest().catch(() => {});
      }
    };
  }, [nfc]);

  if (!nfc) {
    return (
      <Surface testID="nfc-unavailable-surface" variant="secondary" className="rounded-2xl p-5">
        <View className="gap-2">
          <Text className="text-base font-semibold text-foreground">NFC unavailable</Text>
          <Text className="text-sm leading-6 text-muted">
            {isIosSimulator
              ? "NFC scanning requires a physical iPhone. Switch back to QR for the simulator demo."
              : "NFC scanning is only available on iOS hardware."}
          </Text>
        </View>
      </Surface>
    );
  }

  const NfcManager = nfc.default;
  const { NfcTech, Ndef } = nfc;

  const cleanup = async () => {
    if (!sessionActiveRef.current) {
      return;
    }
    sessionActiveRef.current = false;
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  };

  const handleRead = async () => {
    setStatus({ kind: "reading" });
    try {
      sessionActiveRef.current = true;
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      const token = decodeFirstWristbandToken(tag?.ndefMessage ?? []);
      await cleanup();
      if (!token) {
        setStatus({ kind: "error", message: "Tag did not contain a wristband token." });
        return;
      }
      setStatus({ kind: "idle" });
      onCapture(token);
    } catch (error) {
      await cleanup();
      const message = error instanceof Error ? error.message : "NFC read failed.";
      if (/cancel/i.test(message)) {
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({ kind: "error", message });
    }
  };

  const handleWrite = async () => {
    const token = normalizeWristbandToken(writeToken);
    if (!isValidWristbandToken(token)) {
      setStatus({
        kind: "error",
        message: "Token must look like WRISTBAND-XXXX-NFC-001.",
      });
      return;
    }

    setStatus({ kind: "writing" });
    try {
      sessionActiveRef.current = true;
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(token)]);
      if (!bytes) {
        throw new Error("Failed to encode tag payload.");
      }
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      await cleanup();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus({ kind: "wrote", token });
      setWriteToken("");
    } catch (error) {
      await cleanup();
      const message = error instanceof Error ? error.message : "NFC write failed.";
      if (/cancel/i.test(message)) {
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({ kind: "error", message });
    }
  };

  const isBusy = status.kind === "reading" || status.kind === "writing";

  return (
    <View className="gap-3">
      <Surface variant="secondary" className="rounded-2xl p-5">
        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">Tap wristband to scan</Text>
          <Text className="text-sm leading-6 text-muted">
            iOS will show its NFC reader sheet. Hold the wristband near the top of the device.
          </Text>
          <Button testID="nfc-read-button" onPress={handleRead} isDisabled={isBusy}>
            <Button.Label>{status.kind === "reading" ? "Scanning…" : "Scan NFC tag"}</Button.Label>
          </Button>
        </View>
      </Surface>

      {status.kind === "error" ? (
        <Surface variant="secondary" className="rounded-2xl p-5">
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">NFC error</Text>
            <Text className="text-sm leading-6 text-muted">{status.message}</Text>
            <Button variant="secondary" onPress={() => setStatus({ kind: "idle" })}>
              <Button.Label>Dismiss</Button.Label>
            </Button>
          </View>
        </Surface>
      ) : null}

      {status.kind === "wrote" ? (
        <Surface variant="secondary" className="rounded-2xl p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Tag encoded</Text>
            <Text className="text-sm leading-6 text-muted">Wrote {status.token} to the tag.</Text>
          </View>
        </Surface>
      ) : null}

      <Surface variant="secondary" className="rounded-2xl p-5">
        <View className="gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowWriter((prev) => !prev)}
            className="flex-row items-center justify-between"
          >
            <Text className="text-base font-semibold text-foreground">Encode new tag</Text>
            <Text className="text-sm text-muted">{showWriter ? "Hide" : "Show"}</Text>
          </Pressable>

          {showWriter ? (
            <View className="gap-3">
              <Text className="text-sm leading-6 text-muted">
                Writes the token as a single NDEF text record. Pair with admin provisioning to bind
                the tag to a patient.
              </Text>
              <TextInput
                testID="nfc-write-token-input"
                value={writeToken}
                onChangeText={setWriteToken}
                placeholder="WRISTBAND-EXAMPLE-NFC-001"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isBusy}
                className="rounded-xl border border-default-200 bg-background px-4 py-3 text-base text-foreground"
              />
              <Button
                testID="nfc-write-button"
                variant="secondary"
                isDisabled={isBusy || writeToken.trim().length === 0}
                onPress={handleWrite}
              >
                <Button.Label>{status.kind === "writing" ? "Writing…" : "Write tag"}</Button.Label>
              </Button>
            </View>
          ) : null}
        </View>
      </Surface>
    </View>
  );
}
