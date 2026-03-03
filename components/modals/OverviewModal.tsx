// components/test/OverviewModal.tsx
import { Modal, Pressable, Text, View } from "react-native";

interface OverviewModalProps {
  visible: boolean;
  correctCount: number;
  totalCount: number;
  onNewTest: () => void;
  onViewResults: () => void;
}

export const OverviewModal = ({
  visible,
  correctCount,
  totalCount,
  onNewTest,
  onViewResults,
}: OverviewModalProps) => {
  const percentage = Math.round((correctCount / totalCount) * 100);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View className="flex-1 bg-card/50 justify-center items-center p-4">
        <View className="w-[90%] bg-card border border-border p-6 rounded-lg">
          <Text className="text-2xl text-card-foreground font-bold mb-6">
            Rezultati i Testit
          </Text>

          <View className="bg-card p-4 rounded-lg mb-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-card-foreground">Përgjigje të sakta:</Text>
              <Text className="text-card-foreground font-bold">
                {correctCount} / {totalCount}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-card-foreground">Përqindja:</Text>
              <Text className="text-card-foreground font-bold">
                {percentage}%
              </Text>
            </View>
          </View>

          <Pressable
            className="bg-primary p-3 rounded-md active:opacity-80"
            onPress={onNewTest}
          >
            <Text className="text-primary-foreground text-center font-semibold">
              Test i Ri
            </Text>
          </Pressable>
          <Pressable
            className="bg-secondary p-3 rounded-md active:opacity-80 mt-2"
            onPress={onViewResults}
          >
            <Text className="text-secondary-foreground text-center">
              Shiko rezultatet
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
