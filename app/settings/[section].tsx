import { SettingItem } from "@/components/SettingItem";
import { SettingsKey, settingsSchema } from "@/services/settings/settings";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();

  if (!section || !(section in settingsSchema)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-foreground text-lg">Section not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary">
            <Ionicons name="arrow-back" size={20} color="gray" />
            Back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const sectionDef = settingsSchema[section as keyof typeof settingsSchema];
  const subsections = Object.entries(sectionDef.subsections);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Custom Header so we can control styling perfectly in our app layout */}
      <View className="flex-row items-center px-4 py-4 border-b border-border bg-background z-10">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 p-1 active:opacity-50"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            className="text-foreground"
            color="gray"
          />
        </Pressable>
        <Text className="text-foreground text-xl font-bold flex-1">
          {sectionDef.title}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-2">
        {subsections.map(([subKey, subDef]) => (
          <View key={subKey} className="mt-4 mb-6">
            <Text className="text-primary text-sm font-semibold uppercase tracking-wider mb-3 ml-1">
              {subDef.title}
            </Text>

            <View className="bg-card rounded-xl overflow-hidden border border-border">
              {Object.entries(subDef.settings).map(
                ([settingKey, settingDef], index, array) => (
                  <View key={settingKey}>
                    <SettingItem
                      settingKey={settingKey as SettingsKey}
                      def={settingDef}
                    />
                    {index < array.length - 1 && (
                      <View className="h-[1px] bg-border" />
                    )}
                  </View>
                ),
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
