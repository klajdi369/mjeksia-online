import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface BankHeaderProps {
  title?: string | null;
  subtitle?: string | null;
  onBack: () => void;
  onFocusStart?: () => void;
  showFocusButton?: boolean;
}

export const BankHeader: React.FC<BankHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onFocusStart,
  showFocusButton = false,
}) => {
  const { scheme, theme, isDark } = useAppTheme();

  return (
    <View className="mb-4 px-4 pt-2">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 items-center justify-center rounded-full bg-secondary active:opacity-80"
        >
          <Ionicons name="chevron-back" size={20} color="#71717A" />
        </Pressable>

        <View className="flex-1 px-4 items-center">
          <Text
            className="text-xl font-extrabold text-foreground text-center"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-sm text-muted-foreground text-center mt-0.5 font-medium"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="w-10 h-10 items-center justify-center">
          {showFocusButton ? (
            <Pressable
              onPress={onFocusStart}
              className="w-10 h-10 items-center justify-center rounded-full bg-primary active:opacity-80 shadow-md shadow-primary/30"
              accessibilityLabel="Start focused test"
            >
              <Ionicons
                name="rocket"
                size={18}
                color={getThemeColor("--primary-foreground", scheme, theme)}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};
