import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

import { ThemeToggle } from "@/components/theme-toggle";

function NurseWorkflowLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        contentStyle: { backgroundColor: themeColorBackground },
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Nurse workflow",
          headerBackVisible: false,
          headerRight: () => <ThemeToggle />,
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: "Scan wristband",
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="scan-handoff"
        options={{
          title: "Medication selection",
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          title: "Verify medication",
          animation: "none",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

export default NurseWorkflowLayout;
