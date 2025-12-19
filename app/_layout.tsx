import { getThemeColor, themes } from "../constants/theme";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Platform, View } from "react-native";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(
        getThemeColor("--background", colorScheme)
      );
    }
  }, [colorScheme]);

  return (
    <>
      <View
        style={[themes[colorScheme ?? "light"], { flex: 1 }]}
        className="bg-background"
      >
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: getThemeColor("--background", colorScheme),
            },
            headerShadowVisible: false,
            headerTintColor: getThemeColor("--foreground", colorScheme),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="arena"
            options={{
              title: "Arena",
              animation: "fade",
              headerShown: true,
            }}
          />
        </Stack>
      </View>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
    </>
  );
}
