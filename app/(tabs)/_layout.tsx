import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const { scheme, theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: getThemeColor("--primary", scheme, theme),
        headerStyle: {
          backgroundColor: getThemeColor("--background", scheme, theme),
        },
        headerShadowVisible: false,
        headerTintColor: getThemeColor("--foreground", scheme, theme),
        tabBarStyle: {
          backgroundColor: getThemeColor("--background", scheme, theme),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Kryefaqja",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historia",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time-sharp" : "time-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cilesimet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings-sharp" : "settings-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
