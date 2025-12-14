import { themes } from "../constants/theme";
import "../global.css";

import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView style={[themes[colorScheme ?? "light"], { flex: 1 }]}>
      <Stack />
    </SafeAreaView>
  );
}
