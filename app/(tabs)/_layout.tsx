import { getThemeColor } from "@/constants/theme";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getThemeColor("--primary", colorScheme),
        headerStyle: {
          backgroundColor: getThemeColor("--background", colorScheme),
        },
        headerShadowVisible: false,
        headerTintColor: getThemeColor("--foreground", colorScheme),
        tabBarStyle: {
          backgroundColor: getThemeColor("--background", colorScheme),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="mistakes" options={{ title: "Mistakes" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
