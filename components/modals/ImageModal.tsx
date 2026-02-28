// components/test/ImageModal.tsx
import DynamicImage from "@/components/DynamicImage";
import { imageMap } from "@/constants/imageMap";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";

interface ImageModalProps {
  visible: boolean;
  imageKey: string | null;
  onClose: () => void;
}

export const ImageModal = ({ visible, imageKey, onClose }: ImageModalProps) => {
  const { scheme, theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-card/80 justify-center items-center p-4"
        onPress={onClose}
      >
        <View className="absolute top-12 right-6 z-10">
          <Ionicons
            name="close-circle"
            size={40}
            color={getThemeColor("--foreground", scheme, theme)}
          />
        </View>

        {imageKey && (
          <View style={{ width: screenWidth - 40 }}>
            <DynamicImage
              source={imageMap[imageKey as keyof typeof imageMap]}
            />
          </View>
        )}
      </Pressable>
    </Modal>
  );
};
