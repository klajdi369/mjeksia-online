import DynamicImage from "@/components/DynamicImage";
import { imageMap } from "@/constants/imageMap";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSetting } from "@/services/settings/settings";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

interface QuestionImageProps {
  imageKey: string | null;
  onPress: () => void;
}

export const QuestionImage = ({ imageKey, onPress }: QuestionImageProps) => {
  const { theme } = useAppTheme();
  const [alwaysShowPlaceholder] = useSetting("always_show_image_placeholder");

  if (imageKey) {
    return (
      <Pressable
        onPress={onPress}
        className="mt-4 h-52 w-full border-2 border-muted rounded-md items-center justify-center bg-card/50 overflow-hidden"
      >
        <View className="px-4 py-2 w-full h-full items-center">
          <DynamicImage source={imageMap[imageKey as keyof typeof imageMap]} />
          {/* Intentional black/white usage */}
          <View className="absolute bottom-2 right-2 bg-black/50 p-1 rounded">
            <Ionicons name="expand" size={16} color="white" />
          </View>
        </View>
      </Pressable>
    );
  }

  if (alwaysShowPlaceholder) {
    return (
      <View className="mt-4 h-52 w-full border-2 border-dashed border-muted rounded-md items-center justify-center bg-muted/20">
        <Ionicons
          name="image-outline"
          size={48}
          color={getThemeColor("--muted-foreground", theme)}
        />
        <Text className="text-muted-foreground mt-2 font-medium">
          Nuk ka imazh
        </Text>
      </View>
    );
  }

  return null;
};
