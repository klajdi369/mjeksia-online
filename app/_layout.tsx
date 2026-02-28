import { useSettingsSideEffects } from "@/services/settings/settings";
import {
  getThemeColor,
  themes,
  type AppearanceName,
  type ColorSchemeName,
} from "../constants/theme";
import "../global.css";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { scheme, theme, isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
  const hasHiddenSplash = useRef(false);

  // Initialize global settings effects (e.g., Theme propagation)
  useSettingsSideEffects();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(
        getThemeColor("--background", scheme, theme),
      );
    }
  }, [scheme, theme]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;

      SplashScreen.hide();
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <View
        key={`${scheme}-${theme}`}
        onLayout={onLayoutRootView}
        style={[themes[scheme][theme], { flex: 1 }]}
        className="bg-background"
      >
        <StatusBar
          style={isDark ? "light" : "dark"}
          translucent={false}
          backgroundColor={getThemeColor("--background", scheme, theme)}
        />
        <Suspense
          fallback={
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          }
        >
          <SQLiteProvider
            databaseName="questions.db"
            assetSource={{ assetId: require("@/assets/data.db") }}
            useSuspense
          >
            <Content scheme={scheme} theme={theme} />
          </SQLiteProvider>
        </Suspense>
      </View>
    </SafeAreaProvider>
  );
}

function Content({
  scheme,
  theme,
}: {
  scheme: ColorSchemeName;
  theme: AppearanceName;
}) {
  const db = useSQLiteContext();
  useDrizzleStudio(db);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: getThemeColor("--background", scheme, theme),
        },
        headerShadowVisible: false,
        headerTintColor: getThemeColor("--foreground", scheme, theme),
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
      <Stack.Screen
        name="test"
        options={{
          title: "Test",
          animation: "fade",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bank"
        options={{
          title: "Fondi Pyetjeve",
          animation: "fade",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
