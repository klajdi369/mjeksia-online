// settings.tsx
import { SettingRow } from "@/components/SettingRow";
import { SettingsKey, settingsSchema } from "@/constants/settings";
import { useColorScheme } from "nativewind";
import { ScrollView, Text, View } from "react-native";

export default function Settings() {
  const { setColorScheme } = useColorScheme();

  // Group settings by section, filter by scope
  const entries = Object.entries(settingsSchema).filter(
    ([_, def]) => def.scope !== "dev" || __DEV__,
  );

  const sections = entries.reduce<Record<string, SettingsKey[]>>(
    (acc, [key, def]) => {
      (acc[def.section] ??= []).push(key as SettingsKey);
      return acc;
    },
    {},
  );

  // Side effects for specific settings
  const sideEffects: Partial<Record<SettingsKey, (v: string) => void>> = {
    user_theme: (v) => setColorScheme(v as "light" | "dark"),
  };

  return (
    <ScrollView className="flex-1 bg-background px-4">
      {Object.entries(sections).map(([section, keys]) => (
        <View key={section}>
          <Text className="text-foreground text-xl font-semibold mt-6 mb-2">
            {section}
          </Text>
          <View className="h-[1px] w-full bg-border" />
          {keys.map((key) => (
            <SettingRow
              key={key}
              settingKey={key}
              onUpdate={sideEffects[key]}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
