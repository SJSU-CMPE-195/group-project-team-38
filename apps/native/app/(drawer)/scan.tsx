import * as Haptics from "expo-haptics";
import {
  CameraView,
  type BarcodeScanningResult,
  type CameraMountError,
  useCameraPermissions,
} from "expo-camera";
import * as Device from "expo-device";
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
  { label: "Safe patient", token: "WRISTBAND-SAFE-QR-001" },
  { label: "Conflict patient", token: "WRISTBAND-CONFLICT-QR-001" },
] as const;

const DEMO_WRISTBAND_PRESETS = [
  { id: "safe", label: "Safe patient", token: "WRISTBAND-SAFE-QR-001" },
  { id: "conflict", label: "Conflict patient", token: "WRISTBAND-CONFLICT-QR-001" },
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
  const isIosSimulator = Platform.OS === "ios" && Device.isDevice === false;

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
    <Container className="px-6">
      <View className="py-6 gap-6">
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
          <Surface variant="secondary" className="rounded-2xl border border-border p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Sample wristbands</Text>
              <View className="gap-2">
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
          <Surface variant="secondary" className="rounded-2xl border border-border p-5">
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
          <Surface variant="secondary" className="rounded-2xl border border-border p-5">
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
          <Surface variant="secondary" className="rounded-2xl border border-border p-5">
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
          <View className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: 3 / 4 }}>
            <CameraView
              facing="back"
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcodeScanned}
              onMountError={handleCameraError}
            />
            <ScanReticle />
          </View>
        ) : null}

        {scanState === "nfc" ? (
          <NfcPanel onCapture={handleNfcCapture} isIosSimulator={isIosSimulator} />
        ) : null}

        {scanState === "captured" && scannedToken ? (
          <Surface variant="secondary" className="rounded-2xl border border-border p-5">
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Wristband captured</Text>
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
      className="flex-row gap-2 rounded-2xl border border-border bg-surface-secondary p-1"
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
              isSelected ? "bg-background" : ""
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

function ScanReticle() {
  const corner = "absolute h-8 w-8 border-white";
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
      <View className="relative h-3/5 w-4/5">
        <View className={`${corner} left-0 top-0 rounded-tl-xl border-l-[3px] border-t-[3px]`} />
        <View className={`${corner} right-0 top-0 rounded-tr-xl border-r-[3px] border-t-[3px]`} />
        <View className={`${corner} bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]`} />
        <View
          className={`${corner} bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]`}
        />
      </View>
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
      <Surface
        testID="nfc-unavailable-surface"
        variant="secondary"
        className="rounded-2xl border border-border p-5"
      >
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
      <Button testID="nfc-read-button" onPress={handleRead} isDisabled={isBusy}>
        <Button.Label>{status.kind === "reading" ? "Scanning…" : "Scan NFC tag"}</Button.Label>
      </Button>

      {status.kind === "error" ? (
        <Surface variant="secondary" className="rounded-2xl border border-danger p-5">
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
        <Surface variant="secondary" className="rounded-2xl border border-success p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Tag encoded</Text>
            <Text className="text-sm leading-6 text-muted">Wrote {status.token} to the tag.</Text>
          </View>
        </Surface>
      ) : null}

      <Surface variant="secondary" className="rounded-2xl border border-border p-5">
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
              <View className="gap-2">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Presets
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DEMO_WRISTBAND_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.token}
                      testID={`nfc-write-preset-${preset.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Use preset ${preset.label}`}
                      disabled={isBusy}
                      onPress={() => setWriteToken(preset.token)}
                      className={`rounded-full border px-3 py-2 ${
                        writeToken === preset.token
                          ? "border-foreground bg-foreground/10"
                          : "border-border bg-background"
                      } ${isBusy ? "opacity-50" : ""}`}
                    >
                      <Text className="text-xs font-semibold text-foreground">{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <TextInput
                testID="nfc-write-token-input"
                value={writeToken}
                onChangeText={setWriteToken}
                placeholder="WRISTBAND-EXAMPLE-NFC-001"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isBusy}
                className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
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
