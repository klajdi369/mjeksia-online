import { colorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-background">
        <Pressable
          className="bg-primary p-4 rounded-md"
          onPress={() =>
            colorScheme.set(colorScheme.get() === "light" ? "dark" : "light")
          }
        >
          <Text className="text-lg text-primary-foreground font-semibold">
            Toggle Color Scheme
          </Text>
        </Pressable>
      </Text>
    </View>
  );
}
