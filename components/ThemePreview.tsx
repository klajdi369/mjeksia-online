import {
  AppearanceName,
  ColorSchemeName,
  getThemeColor,
} from "@/constants/theme";
import { View } from "react-native";

interface ThemePreviewProps {
  scheme: ColorSchemeName;
  appearance: AppearanceName;
}

export function ThemePreview({ scheme, appearance }: ThemePreviewProps) {
  const colors = [
    "--primary",
    "--accent",
    "--secondary",
    "--background",
  ] as const;

  return (
    <View className="flex-row gap-1 mr-2">
      {colors.map((color) => (
        <View
          key={color}
          className="w-4 h-4 rounded border border-border/50"
          style={{
            backgroundColor: getThemeColor(color, scheme, appearance),
          }}
        />
      ))}
    </View>
  );
}
