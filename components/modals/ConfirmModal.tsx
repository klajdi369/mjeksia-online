// components/test/ConfirmModal.tsx
import { Modal, Pressable, Text, View } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  unansweredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = ({
  visible,
  unansweredCount,
  onCancel,
  onConfirm,
}: ConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-card/50 justify-center items-center p-4">
        <View className="w-[85%] bg-card border border-border p-4 rounded-md">
          <Text className="text-lg text-card-foreground">Perfundo testin?</Text>
          {unansweredCount > 0 && (
            <Text className="text-card-foreground mt-2">
              {unansweredCount} pyetje jane pa pergjigje
            </Text>
          )}
          <View className="flex-row gap-2 mt-4">
            <Pressable
              className="flex-1 bg-secondary border border-border p-3 rounded-md active:opacity-80"
              onPress={onCancel}
            >
              <Text className="text-secondary-foreground text-center font-semibold">
                Anulo
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-primary p-3 rounded-md active:opacity-80"
              onPress={onConfirm}
            >
              <Text className="text-primary-foreground text-center font-semibold">
                Konfirmo
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
