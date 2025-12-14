import { themes } from "../constants/theme";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <View style={[themes[colorScheme ?? "light"], { flex: 1 }]}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
    </>
  );
}
