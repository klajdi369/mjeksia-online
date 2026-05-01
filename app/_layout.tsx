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
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

// expo-sqlite's WASM worker on web serializes query results to JSON without
// escaping control characters (newlines, tabs, form feeds, etc.) that appear
// in string column values. This monkey-patch fixes those strings before
// JSON.parse sees them. It is a no-op for already-valid JSON.
if (Platform.OS === "web") {
  const _originalParse = JSON.parse;
  // @ts-ignore – intentional global patch
  JSON.parse = function patchedJsonParse(text: unknown, reviver?: unknown) {
    if (typeof text === "string") {
      text = repairJsonControlChars(text);
    }
    // @ts-ignore
    return _originalParse.call(this, text, reviver);
  };
}

function repairJsonControlChars(input: string): string {
  let out = "";
  let inStr = false;
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    const code = input.charCodeAt(i);
    if (inStr) {
      if (c === "\\" && i + 1 < input.length) {
        // copy escape sequence verbatim
        out += c + input[i + 1];
        i += 2;
        continue;
      }
      if (c === '"') {
        inStr = false;
        out += c;
        i++;
        continue;
      }
      // bare control char inside a JSON string — must be escaped
      if (code < 0x20) {
        switch (code) {
          case 0x08: out += "\\b"; break;
          case 0x09: out += "\\t"; break;
          case 0x0a: out += "\\n"; break;
          case 0x0c: out += "\\f"; break;
          case 0x0d: out += "\\r"; break;
          default:   out += `\\u${code.toString(16).padStart(4, "0")}`; break;
        }
        i++;
        continue;
      }
    } else if (c === '"') {
      inStr = true;
    }
    out += c;
    i++;
  }
  return out;
}

export default function RootLayout() {
  const { scheme, theme, isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
  const [sqliteError, setSqliteError] = useState<Error | null>(null);
  const hasHiddenSplash = useRef(false);
  const databaseName = "questions.db";

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

  if (sqliteError) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-center text-lg font-semibold text-foreground">
            Database failed to initialize on web preview
          </Text>
          <Text className="mt-3 text-center text-sm text-muted-foreground">
            {sqliteError.message}
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
        <SQLiteProvider
          databaseName={databaseName}
          assetSource={{
            assetId: require("@/assets/data.db"),
          }}
          onError={setSqliteError}
        >
          {__DEV__ && Platform.OS !== "web" ? <DrizzleStudioDevtools /> : null}
          <Content scheme={scheme} theme={theme} />
        </SQLiteProvider>
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
