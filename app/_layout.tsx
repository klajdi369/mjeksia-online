import { getSetting } from "@/constants/settings";
import { getThemeColor, themes } from "../constants/theme";
import "../global.css";

import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    setColorScheme(getSetting("user_theme"));

    setIsReady(true);
  }, [setColorScheme]);

  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(
        getThemeColor("--background", colorScheme),
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
    <SafeAreaProvider>
      <View
        key={colorScheme}
        onLayout={onLayoutRootView}
        style={[themes[colorScheme ?? "light"], { flex: 1 }]}
        className="bg-background"
      >
        <StatusBar
          style={colorScheme === "light" ? "dark" : "light"}
          translucent={false}
          backgroundColor={getThemeColor("--background", colorScheme)}
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
            <Content colorScheme={colorScheme} />
          </SQLiteProvider>
        </Suspense>
      </View>
    </SafeAreaProvider>
  );
}

function Content({
  colorScheme,
}: {
  colorScheme: "light" | "dark" | undefined;
}) {
  const db = useSQLiteContext();
  useDrizzleStudio(db);

  return (
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
      <Stack.Screen
        name="test"
        options={{
          title: "Test",
          animation: "fade",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
