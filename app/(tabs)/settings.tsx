// settings.tsx
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { settingsSchema } from "@/services/settings/settings";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function Settings() {
  const { scheme, theme } = useAppTheme();

  const accentForegroundColor = getThemeColor(
    "--accent-foreground",
    scheme,
    theme,
  );
  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <View className="gap-4">
        {Object.entries(settingsSchema).map(([sectionKey, sectionDef]) => (
          <Pressable
            key={sectionKey}
            onPress={() =>
              router.push({
                pathname: "/settings/[section]",
                params: { section: sectionKey },
              })
            }
            className="flex-row items-center justify-between p-4 bg-card rounded-xl border border-border active:opacity-70"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
                <Ionicons
                  name={sectionDef.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={accentForegroundColor}
                />
              </View>
              <Text className="text-foreground text-lg font-medium">
                {sectionDef.title}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="gray"
              className="text-muted-foreground"
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
