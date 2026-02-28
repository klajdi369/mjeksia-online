import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatTime } from "@/lib/utils";
import { Stack } from "expo-router";
import { Text } from "react-native";

interface TimerHeaderProps {
  title: string;
  remainingSeconds: number;
  lowTimeThreshold?: number;
}

export const TimerHeader = ({
  title,
  remainingSeconds,
  lowTimeThreshold = 60,
}: TimerHeaderProps) => {
  const { scheme, theme } = useAppTheme();
  const isLowTime = remainingSeconds <= lowTimeThreshold;

  const timerColor = isLowTime
    ? getThemeColor("--destructive", scheme, theme)
    : getThemeColor("--foreground", scheme, theme);

  return (
    <Stack.Screen
      options={{
        title: title,
        headerRight: () => (
          <Text
            style={{
              marginRight: 12,
              fontSize: 16,
              fontWeight: "700",
              color: timerColor,
            }}
          >
            {formatTime(remainingSeconds)}
          </Text>
        ),
      }}
    />
  );
};
