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

const scannerChecklist = [
  "Ask for camera access before activating the scanner.",
  "Read QR wristband tokens only.",
  "Stop the preview as soon as a token is captured.",
] as const;

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
        <Surface variant="secondary" className="rounded-xl p-5">
          <View className="gap-3">
            <Text className="text-xl font-semibold text-foreground">Scan patient wristband</Text>
            <Text className="text-sm leading-6 text-muted">
              This shell only handles camera access and QR token capture. Once a wristband token is
              read, the live preview unmounts so the next step can take over with a single captured
              value.
            </Text>
          </View>
        </Surface>

        {!isIosSimulator ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-sm font-semibold uppercase tracking-wide text-primary">
                Scanner rules
              </Text>
              {scannerChecklist.map((item) => (
                <View key={item} className="flex-row gap-3">
                  <Text className="text-sm font-semibold text-primary">•</Text>
                  <Text className="flex-1 text-sm leading-6 text-muted">{item}</Text>
                </View>
              ))}
            </View>
          </Surface>
        ) : null}

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
                The iOS Simulator cannot exercise a live bedside camera scan reliably. These seeded
                QR fixtures inject the same wristband token that a real scan would capture so the
                downstream nurse workflow stays unchanged.
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
                    <Text className="text-xs text-muted">Token: {fixture.token}</Text>
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
          <Surface variant="secondary" className="rounded-xl p-3">
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
                Align the patient QR wristband inside the frame. The first valid QR token will stop
                the live preview immediately.
              </Text>
            </View>
          </Surface>
        ) : null}

        {scanState === "captured" && scannedToken ? (
          <Surface variant="secondary" className="rounded-xl p-5">
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                Wristband token captured
              </Text>
              <Text className="text-sm leading-6 text-muted">
                The scanner preview is now unmounted. Hand this token to the next nurse-flow step to
                load the patient context and medication list.
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
                  router.replace({
                    pathname: "/(drawer)/scan-handoff",
                    params: { wristbandToken: scannedToken },
                  });
                }}
              >
                <Button.Label>Continue with this wristband</Button.Label>
              </Button>
              <Button onPress={handleScanAgain}>
                <Button.Label>Scan another wristband</Button.Label>
              </Button>
            </View>
          </Surface>
        ) : null}

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
