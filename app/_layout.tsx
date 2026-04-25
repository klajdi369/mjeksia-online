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
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { scheme, theme, isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
  const hasHiddenSplash = useRef(false);

  const isWebSqliteSupported =
    Platform.OS !== "web" || typeof SharedArrayBuffer !== "undefined";
  // Use a dedicated web DB file to avoid stale empty DBs created in earlier previews.
  const databaseName = Platform.OS === "web" ? "questions-web.db" : "questions.db";

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

  if (!isWebSqliteSupported) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-center text-lg font-semibold text-foreground">
            Web preview needs SharedArrayBuffer support
          </Text>
          <Text className="mt-3 text-center text-sm text-muted-foreground">
            This Codespaces preview is missing required cross-origin isolation
            headers for expo-sqlite. Open the app on native, or deploy web with
            COOP/COEP headers enabled.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

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
            databaseName={databaseName}
            assetSource={{
              assetId: require("@/assets/data.db"),
              forceOverwrite: Platform.OS === "web",
            }}
            useSuspense
          >
            {__DEV__ && Platform.OS !== "web" ? <DrizzleStudioDevtools /> : null}
            <Content scheme={scheme} theme={theme} />
          </SQLiteProvider>
        </Suspense>
      </View>
    </SafeAreaProvider>
  );
}

function DrizzleStudioDevtools() {
  const db = useSQLiteContext();

  useDrizzleStudio(db);

  return null;
}

function Content({
  scheme,
  theme,
}: {
  scheme: ColorSchemeName;
  theme: AppearanceName;
}) {
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
        name="retest"
        options={{
          title: "Retest",
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
      <Stack.Screen
        name="history"
        options={{
          title: "Historia Pyetjeve",
          animation: "fade",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
