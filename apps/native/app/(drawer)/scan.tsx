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
import { useMemo, useState } from "react";
import { Platform, Text, View } from "react-native";

import { Container } from "@/components/container";

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

export default function ScanEntryScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const isIosSimulator = Platform.OS === "ios" && !Constants.isDevice;

  const scanState = useMemo(() => {
    if (scannedToken) {
      return "captured";
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
  }, [cameraError, isIosSimulator, permission, scannedToken]);

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

  return (
    <Container className="px-4 pb-4">
      <View className="py-6 gap-4">
        <Surface variant="secondary" className="rounded-2xl p-5">
          <View className="gap-3">
            <Text testID="scan-screen-title" className="text-xl font-semibold text-foreground">
              Scan patient wristband
            </Text>
            <Text className="text-sm leading-6 text-muted">
              Capture the bedside QR code to load the patient context.
            </Text>
          </View>
        </Surface>

        {scanState === "simulator-demo" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Simulator demo wristbands
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  Use seeded QR fixtures on iOS Simulator
                </Text>
              </View>
              <Text className="text-sm leading-6 text-muted">
                Choose a safe or conflict case to continue without the camera.
              </Text>
              <View className="gap-3">
                {simulatorDemoWristbands.map((fixture) => (
                  <Button
                    key={fixture.token}
                    testID={`demo-wristband-${fixture.token}`}
                    accessibilityLabel={fixture.label}
                    onPress={() => handleUseDemoWristband(fixture.token)}
                  >
                    <Button.Label>{fixture.label}</Button.Label>
                  </Button>
                ))}
              </View>
              <View className="gap-3 rounded-xl bg-background px-4 py-4">
                {simulatorDemoWristbands.map((fixture) => (
                  <View key={`${fixture.token}-description`} className="gap-1">
                    <Text className="text-sm font-semibold text-foreground">{fixture.label}</Text>
                    <Text className="text-sm leading-6 text-muted">{fixture.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Surface>
        ) : null}

        {scanState === "loading-permission" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="flex-row items-center gap-3">
              <Spinner size="sm" color="default" />
              <Text className="text-sm text-muted">Checking camera permission…</Text>
            </View>
          </Surface>
        ) : null}

        {scanState === "permission-required" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Camera access needed</Text>
              <Text className="text-sm leading-6 text-muted">
                Meditag needs camera access to scan QR wristbands at the bedside. The scanner will
                stay off until permission is granted.
              </Text>
              <Button onPress={handleRequestPermission}>
                <Button.Label>Allow camera access</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "permission-denied" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Camera access denied</Text>
              <Text className="text-sm leading-6 text-muted">
                Camera permission was denied for this app. Re-enable it in iOS Settings, then come
                back here to scan a wristband.
              </Text>
              <Button
                onPress={() => {
                  router.back();
                }}
              >
                <Button.Label>Back to workflow entry</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "camera-error" ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Scanner unavailable</Text>
              <Text className="text-sm leading-6 text-muted">
                {cameraError ?? "The camera preview could not start."}
              </Text>
              <Button onPress={handleScanAgain}>
                <Button.Label>Try camera again</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        {scanState === "scanning" ? (
          <Surface variant="secondary" className="rounded-2xl p-3">
            <View className="gap-3">
              <View className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: 3 / 4 }}>
                <CameraView
                  facing="back"
                  style={{ flex: 1 }}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={handleBarcodeScanned}
                  onMountError={handleCameraError}
                />
              </View>
              <Text className="text-sm leading-6 text-muted">
                Hold the wristband inside the frame. Scanning stops automatically after capture.
              </Text>
            </View>
          </Surface>
        ) : null}

        {scanState === "captured" && scannedToken ? (
          <Surface variant="secondary" className="rounded-2xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">Wristband captured</Text>
              <Text className="text-sm leading-6 text-muted">
                Continue to review the patient record and choose a medication.
              </Text>
              <View className="rounded-xl bg-background px-4 py-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Captured QR token
                </Text>
                <Text className="mt-2 text-sm text-foreground">{scannedToken}</Text>
              </View>
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
              <Button variant="secondary" onPress={handleScanAgain}>
                <Button.Label>Scan again</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

        <Button
          variant="secondary"
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
