import DynamicImage from "@/components/DynamicImage";
import { imageMap } from "@/constants/imageMap";
import * as schema from "@/db/schema";
import { questions } from "@/db/schema";
import { cn } from "@/lib/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { sql, type InferSelectModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Arena() {
  const db = useSQLiteContext();

  // Memoize the drizzle instance so it doesn't re-create on every render
  const drizzleDb = useMemo(() => drizzle(db, { schema }), [db]);

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
    // Prevent changing guess once selected
    if (!guess) {
      setGuess(letter);
    }
  };

  const onNext = () => {
    setGuess(undefined);
    loadNewQuestion(); // Fetch next random question from DB
  };

  // Show loading state while DB is fetching the first question
  if (!currentQuestion) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-between">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-muted-foreground mb-2">
          Pyetja {currentQuestion.subId} - {currentQuestion.exam_title}
        </Text>
        <Text className="text-foreground text-lg leading-6 font-medium">
          {currentQuestion.question_text}
        </Text>

        <View className="mt-4 h-64 w-full border-2 border-muted rounded-md items-center justify-center bg-card/50 overflow-hidden">
          {currentQuestion.image ? (
            <View className="px-6 w-full">
              <DynamicImage
                source={
                  imageMap[currentQuestion.image as keyof typeof imageMap]
                }
              />
            </View>
          ) : (
            <Text className="text-muted-foreground italic">Pa figurë</Text>
          )}
        </View>

        <View className="gap-3 mt-6">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const isCorrect = currentQuestion.answer === letter;
            const isSelected = guess === letter;

            return (
              <Pressable
                key={letter}
                disabled={!!guess}
                className={cn(
                  "border-border bg-secondary border px-4 py-3 rounded-md active:opacity-80",
                  // Red background if this was our wrong guess
                  isSelected &&
                    !isCorrect &&
                    "bg-destructive border-destructive",
                  // Green background if this is the correct answer AND we have guessed
                  guess && isCorrect && "bg-green-600 border-green-700"
                )}
                onPress={() => onGuess(letter)}
              >
                <Text
                  className={cn(
                    "text-foreground",
                    guess && isCorrect && "text-white font-bold",
                    isSelected && !isCorrect && "text-white"
                  )}
                >
                  {letter}:{" "}
                  {
                    currentQuestion[
                      `option_${letter.toLowerCase()}` as keyof typeof currentQuestion
                    ]
                  }
                </Text>
              </Pressable>
            );
          })}
        </View>

        {guess && (
          <View className="mt-4 p-4 bg-accent/20 rounded-lg border border-accent/30">
            <Text className="text-accent-foreground font-bold mb-1">
              Shpjegimi:
            </Text>
            <Text className="text-accent-foreground/90 text-sm">
              {currentQuestion.explanation ||
                "Nuk ka shpjegim për këtë pyetje."}
            </Text>
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
