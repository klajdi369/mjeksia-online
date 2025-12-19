import { getThemeColor, themes } from "../constants/theme";
import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Storage from "expo-sqlite/kv-store";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    const savedTheme = Storage.getItemSync("user_theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      setColorScheme(savedTheme);
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(
        getThemeColor("--background", colorScheme)
      );
    }
  }, [colorScheme]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;

      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <>
      <View
        onLayout={onLayoutRootView}
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
