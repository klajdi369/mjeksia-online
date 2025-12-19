import Storage from "expo-sqlite/kv-store";
import { useColorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";

export default function Settings() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const toggleAndPersist = () => {
    const newTheme = colorScheme === "dark" ? "light" : "dark";

    setColorScheme(newTheme);

    Storage.setItemSync("user_theme", newTheme);
  };

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Pressable
        className="bg-primary p-4 rounded-md"
        onPress={toggleAndPersist}
      >
        <Text className="text-lg text-primary-foreground font-semibold">
          Toggle Color Scheme ({colorScheme})
        </Text>
      </Pressable>
    </View>
  );
}
