import DynamicImage from "@/components/DynamicImage";
import MathText from "@/components/MathText";
import { imageMap } from "@/constants/imageMap";
import { getThemeColor } from "@/constants/theme";
import * as schema from "@/db/schema";
import { questions } from "@/db/schema";
import { useDrizzle } from "@/hooks/useDrizzle";
import { cn } from "@/lib/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { sql, type InferSelectModel } from "drizzle-orm";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const HORIZONTAL_PADDING = 16;

export default function Arena() {
  const { colorScheme } = useColorScheme();
  const drizzleDb = useDrizzle();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<
    InferSelectModel<typeof questions> | undefined
  >(undefined);

  const [guess, setGuess] = useState<"A" | "B" | "C" | "D" | undefined>(
    undefined
  );

  const loadNewQuestion = async () => {
    try {
      const result = await drizzleDb
        .select()
        .from(schema.questions)
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (result.length > 0) {
        setCurrentQuestion(result[0]);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  // Load a question when the screen opens
  useEffect(() => {
    loadNewQuestion();
  }, []);

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
          color={getThemeColor("--muted-foreground", colorScheme)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-between">
      {/* --- IMAGE POPUP --- */}
      <Modal
        visible={isImageModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalOpen(false)}
      >
        <Pressable
          className="flex-1 bg-card/80 justify-center items-center p-4"
          onPress={() => setIsImageModalOpen(false)}
        >
          {/* Close Button */}
          <View className="absolute top-12 right-6 z-10">
            <Ionicons
              name="close-circle"
              size={40}
              color={getThemeColor("--foreground", colorScheme)}
            />
          </View>

          {/* Large Image */}
          {currentQuestion.image && (
            <View style={{ width: SCREEN_WIDTH - 40 }}>
              <DynamicImage
                source={
                  imageMap[currentQuestion.image as keyof typeof imageMap]
                }
              />
            </View>
          )}
        </Pressable>
      </Modal>

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
          color={getThemeColor("--foreground", colorScheme)}
          text={currentQuestion.question_text}
          className="text-foreground text-lg leading-6 font-medium"
          paddingHorizontal={HORIZONTAL_PADDING * 2}
        />
        <Pressable
          onPress={() => setIsImageModalOpen(true)}
          className="mt-4 h-52 w-full border-2 border-muted rounded-md items-center justify-center bg-card/50 overflow-hidden"
        >
          {currentQuestion.image ? (
            <View className="px-4 py-2 w-full h-full items-center">
              <DynamicImage
                source={
                  imageMap[currentQuestion.image as keyof typeof imageMap]
                }
              />
              {/* Intentional black/white usage */}
              <View className="absolute bottom-2 right-2 bg-black/50 p-1 rounded">
                <Ionicons name="expand" size={16} color="white" />
              </View>
            </View>
          ) : (
            <Text className="text-muted-foreground italic">Pa figurë</Text>
          )}
        </Pressable>
        <View className="gap-3 mt-6">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const isCorrect = currentQuestion.answer === letter;
            const isSelected = guess === letter;

            return (
              <Pressable
                key={letter}
                disabled={!!guess}
                className={cn(
                  "border-border bg-secondary border px-4 py-3 rounded-md active:opacity-80 justify-center",
                  // Red background if this was our wrong guess
                  isSelected &&
                    !isCorrect &&
                    "bg-destructive border-destructive",
                  // Green background if this is the correct answer AND we have guessed
                  guess && isCorrect && "bg-green-600 border-green-700"
                )}
                onPress={() => onGuess(letter)}
              >
                <MathText
                  className={cn(
                    "text-foreground align-middle",
                    guess && isCorrect && "text-foreground font-bold",
                    isSelected && !isCorrect && "text-foreground"
                  )}
                  text={`${
                    currentQuestion[
                      `option_${letter.toLowerCase()}` as keyof typeof currentQuestion
                    ]
                  }`}
                  color={getThemeColor("--foreground", colorScheme)}
                  // Account for ScrollView padding + button padding + border
                  paddingHorizontal={HORIZONTAL_PADDING * 2 + 16 * 2 + 1}
                />
              </Pressable>
            );
          })}
        </View>
        {guess && (
          <View className="mt-4 p-4 bg-accent rounded-lg border border-accent/30">
            <Text className="text-accent-foreground font-bold mb-1">
              Shpjegimi:
            </Text>
            <MathText
              color={getThemeColor("--accent-foreground", colorScheme, 0.9)}
              text={currentQuestion.explanation}
              className="text-accent-foreground/90 text-sm"
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
