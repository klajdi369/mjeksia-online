import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen
          name="mistakes"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="test/[id]"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </SafeAreaView>
  );
}
