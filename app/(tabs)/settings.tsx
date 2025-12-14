import { useColorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";

export default function Settings() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Pressable
        className="bg-primary p-4 rounded-md"
        onPress={toggleColorScheme}
      >
        <Text className="text-lg text-primary-foreground font-semibold">
          Toggle Color Scheme ({colorScheme})
        </Text>
      </Pressable>
    </View>
  );
}
