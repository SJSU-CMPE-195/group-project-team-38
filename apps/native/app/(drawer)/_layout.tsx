import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

function NurseWorkflowLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Stack
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        headerRight: renderThemeToggle,
        contentStyle: { backgroundColor: themeColorBackground },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Nurse workflow",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: "Scan wristband",
        }}
      />
      <Stack.Screen
        name="scan-handoff"
        options={{
          title: "Scan handoff",
        }}
      />
    </Stack>
  );
}

export default NurseWorkflowLayout;
