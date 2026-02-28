import MathText from "@/components/MathText";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import React from "react";
import { Pressable, View } from "react-native";

export type OptionLetter = "A" | "B" | "C" | "D";

interface QuestionOptionsProps {
  options: Record<string, any>;
  correctAnswer: string;
  selectedOption?: OptionLetter;
  onOptionPress: (letter: OptionLetter) => void;
  isRevealed: boolean;
  disabled?: boolean;
  horizontalPadding: number;
}

export const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  options,
  correctAnswer,
  selectedOption,
  onOptionPress,
  isRevealed,
  disabled,
  horizontalPadding,
}) => {
  const { scheme, theme } = useAppTheme();

  return (
    <View className="gap-3 mt-6">
      {(["A", "B", "C", "D"] as const).map((letter) => {
        const isCorrect = correctAnswer === letter;
        const isSelected = selectedOption === letter;

        // Determine styles based on state
        let containerStyle = "border-border bg-card";
        let textStyle = "text-card-foreground";
        let mathTextColor = getThemeColor("--card-foreground", scheme, theme);

        if (isRevealed) {
          if (isCorrect) {
            containerStyle = "bg-success/15 border-success/60";
            textStyle = "text-success font-bold";
            mathTextColor = getThemeColor("--success", scheme, theme);
          } else if (isSelected) {
            containerStyle = "bg-destructive/15 border-destructive/60";
            textStyle = "text-destructive";
            mathTextColor = getThemeColor("--destructive", scheme, theme);
          }
        } else if (isSelected) {
          containerStyle = "bg-info/15 border-info/60";
          textStyle = "text-info font-bold";
          mathTextColor = getThemeColor("--info", scheme, theme);
        }

        return (
          <Pressable
            key={letter}
            disabled={disabled}
            className={cn(
              "border-2 px-4 py-3 rounded-xl active:opacity-80 justify-center transition-all",
              containerStyle,
            )}
            onPress={() => onOptionPress(letter)}
          >
            <MathText
              className={cn("align-middle", textStyle)}
              text={`${options[`option_${letter.toLowerCase()}`] || ""}`}
              color={mathTextColor}
              // Account for ScrollView padding + button padding + border
              paddingHorizontal={horizontalPadding * 2 + 16 * 2 + 2}
            />
          </Pressable>
        );
      })}
    </View>
  );
};
