import { type AppearanceName, type ColorSchemeName } from "@/constants/theme";
import { useSetting } from "@/services/settings/settings";
import { useColorScheme } from "react-native";

export function useAppTheme() {
  const [scheme] = useSetting("user_color_scheme");
  const [appearance] = useSetting("user_appearance");
  const systemScheme = useColorScheme();

  const resolvedAppearance =
    appearance === "system"
      ? ((systemScheme ?? "light") as AppearanceName)
      : (appearance as AppearanceName);

  const isDark = resolvedAppearance === "dark";

  return {
    scheme: scheme as ColorSchemeName,
    theme: resolvedAppearance,
    isDark,
  } as const;
}
