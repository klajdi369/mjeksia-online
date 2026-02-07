import SettingsToggle from "@/components/SettingsToggle";
import Storage from "expo-sqlite/kv-store";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Text, View } from "react-native";

export default function Settings() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(
    colorScheme === "dark",
  );

  const toggleSwitch = () => {
    const newTheme = colorScheme === "dark" ? "light" : "dark";

    setColorScheme(newTheme);

    Storage.setItemSync("user_theme", newTheme);
    setIsDarkThemeEnabled((previousState) => !previousState);
  };

  // DEBUG
  const [isTestQuestionAmount10, setIsTestQuestionAmount10] = useState(
    Storage.getItemSync("test_question_amount") === "10",
  );

  const toggleTestQuestionAmount = () => {
    if (isTestQuestionAmount10) {
      Storage.setItemSync("test_question_amount", "50");
    } else {
      Storage.setItemSync("test_question_amount", "10");
    }
    setIsTestQuestionAmount10((previousState) => !previousState);
  };

  return (
    <View className="flex-1 bg-background px-4">
      <SettingsToggle
        text="Dark mode"
        isEnabled={isDarkThemeEnabled}
        action={toggleSwitch}
      />
      <View className="h-[1px] w-full bg-border" />
      {__DEV__ && (
        <>
          <Text className="text-foreground text-2xl font-semibold mt-6">
            Debug
          </Text>
          <SettingsToggle
            text="Set test questions to 10"
            isEnabled={isTestQuestionAmount10}
            action={toggleTestQuestionAmount}
          />
        </>
      )}
    </View>
  );
}
