import MarkdownTable from "@/components/MarkdownTable";
import MathText from "@/components/MathText";
import { ImageModal } from "@/components/modals/ImageModal";
import { QuestionImage } from "@/components/QuestionImage";
import { QuestionOptions } from "@/components/QuestionOptions";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useDrizzle } from "@/hooks/useDrizzle";
import { getRandomQuestion } from "@/services/db/questions";
import { questions } from "@/services/db/schema";
import { useSetting } from "@/services/settings/settings";
import Ionicons from "@expo/vector-icons/Ionicons";
import { type InferSelectModel } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const HORIZONTAL_PADDING = 16;

export default function Arena() {
  const { scheme, theme } = useAppTheme();
  const { drizzleDb } = useDrizzle();
  const [hideExplanation] = useSetting("hide_arena_explanation");

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<
    InferSelectModel<typeof questions> | undefined
  >(undefined);

  const [guess, setGuess] = useState<"A" | "B" | "C" | "D" | undefined>(
    undefined,
  );

  const loadNewQuestion = useCallback(async () => {
    try {
      const result = await getRandomQuestion(drizzleDb);
      if (result.length > 0) {
        setCurrentQuestion(result[0]);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  }, [drizzleDb]);

  // Load a question when the screen opens
  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const onGuess = (letter: "A" | "B" | "C" | "D") => {
    if (!guess) {
      setGuess(letter);
    }
  };

  const onNext = () => {
    setGuess(undefined);
    loadNewQuestion();
  };

  // Show loading state while DB is fetching the first question
  if (!currentQuestion) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator
          size="large"
          color={getThemeColor("--muted-foreground", scheme, theme)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-between">
      {/* --- IMAGE POPUP --- */}
      <ImageModal
        visible={isImageModalOpen}
        imageKey={currentQuestion.image}
        onClose={() => setIsImageModalOpen(false)}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: 24,
        }}
      >
        <Text className="text-muted-foreground mb-2">
          Pyetja {currentQuestion.subId} - {currentQuestion.exam_title}
        </Text>
        <MathText
          color={getThemeColor("--foreground", scheme, theme)}
          text={currentQuestion.question_text}
          className="text-foreground text-lg leading-6 font-medium"
          paddingHorizontal={HORIZONTAL_PADDING * 2}
        />
        <MarkdownTable
          content={currentQuestion.table_content}
          horizontalPadding={HORIZONTAL_PADDING * 2}
          className="mt-4"
        />
        <QuestionImage
          imageKey={currentQuestion.image}
          onPress={() => setIsImageModalOpen(true)}
        />
        <QuestionOptions
          options={currentQuestion}
          correctAnswer={currentQuestion.answer}
          selectedOption={guess}
          onOptionPress={onGuess}
          isRevealed={!!guess}
          disabled={!!guess}
          horizontalPadding={HORIZONTAL_PADDING}
        />
        {guess && !hideExplanation && (
          <View className="mt-4 p-4 bg-secondary rounded-lg border border-secondary/30">
            <Text className="text-secondary-foreground font-bold mb-1">
              Shpjegimi:
            </Text>
            <MathText
              color={getThemeColor(
                "--secondary-foreground",
                scheme,
                theme,
                0.9,
              )}
              text={currentQuestion.explanation}
              className="text-secondary-foreground/90 text-sm"
              fontSize={14}
              // Account for ScrollView padding + button padding + border
              paddingHorizontal={HORIZONTAL_PADDING * 2 + 16 * 2 + 1}
            />
          </View>
        )}
      </ScrollView>

      <View className="p-6 border-t border-border bg-background">
        <Pressable
          className="bg-primary p-4 w-full rounded-lg active:bg-primary/90 flex-row justify-between items-center"
          onPress={onNext}
        >
          <Text className="font-semibold text-lg text-primary-foreground">
            Continue
          </Text>
          <Ionicons name="arrow-forward" size={22} color="black" />
        </Pressable>
      </View>
    </View>
  );
}
