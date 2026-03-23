import { Text, View } from "react-native";

type MediTagLogoProps = {
  size?: "sm" | "lg";
};

export function MediTagLogo({ size = "lg" }: MediTagLogoProps) {
  const isLarge = size === "lg";

  return (
    <View className="items-center gap-4">
      <View
        className={`items-center justify-center rounded-[28px] border border-primary/20 bg-primary/10 ${
          isLarge ? "h-28 w-28" : "h-20 w-20"
        }`}
      >
        <Text
          className={`${isLarge ? "text-4xl" : "text-3xl"} font-bold tracking-tight text-primary`}
        >
          M
        </Text>
      </View>
      <View className="items-center gap-1">
        <Text
          className={`${isLarge ? "text-4xl" : "text-3xl"} font-semibold tracking-tight text-foreground`}
        >
          MediTag
        </Text>
        <Text className="text-sm text-muted">Medication verification</Text>
      </View>
    </View>
  );
}
