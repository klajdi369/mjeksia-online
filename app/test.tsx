import MarkdownTable from "@/components/MarkdownTable";
import MathText from "@/components/MathText";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ImageModal } from "@/components/modals/ImageModal";
import { OverviewModal } from "@/components/modals/OverviewModal";
import { QuestionImage } from "@/components/QuestionImage";
import { TimerHeader } from "@/components/TimerHeader";
import { getThemeColor } from "@/constants/theme";
import { loadNQuestions } from "@/db/questions";
import { questions } from "@/db/schema";
import { insertTestSession } from "@/db/testSessions";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { useDrizzle } from "@/hooks/useDrizzle";
import { cn } from "@/lib/utils";
import { getSetting } from "@/services/settings/settings";
import Ionicons from "@expo/vector-icons/Ionicons";
import { InferSelectModel } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const HORIZONTAL_PADDING = 16;

const Test = () => {
  // Read config once on mount using lazy initializer
  const [numberOfQuestions] = useState(() =>
    parseInt(getSetting("test_question_amount"), 10),
  );
  const [totalTime] = useState(() => parseFloat(getSetting("test_time")) * 60);

  const { drizzleDb } = useDrizzle();
  const { theme } = useAppTheme();

  const [error, setError] = useState(false);
  const [allQuestions, setAllQuestions] = useState<
    InferSelectModel<typeof questions>[] | undefined
  >(undefined);
  const [guesses, setGuesses] = useState<("A" | "B" | "C" | "D" | undefined)[]>(
    () => new Array(numberOfQuestions).fill(undefined),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);

  const writeToDatabase = useCallback(
    async (completed: boolean, timeLeft: number) => {
      if (!allQuestions) {
        return;
      }

      const score = guesses.filter(
        (g, i) => g === allQuestions[i].answer,
      ).length;

      const questionsObject = guesses.map((guess, i) => {
        const question = allQuestions[i];

        return {
          questionId: question.id,
          selected_option: guess ? guess : null,
          is_correct: guess === question.answer,
        };
      });

      await insertTestSession(
        drizzleDb,
        {
          score: score,
          time_left: timeLeft,
          total_questions: allQuestions.length,
          is_completed: completed,
        },
        questionsObject,
      );
    },
    [allQuestions, guesses, drizzleDb],
  );

  // Handle time up
  const handleTimeUp = useCallback(
    (timeLeft: number) => {
      setIsFinished(true);
      setIsOverviewModalOpen(true);

      writeToDatabase(false, timeLeft);
    },
    [writeToDatabase],
  );

  // Use the custom timer hook
  const {
    remainingSeconds,
    restart: restartTimer,
    stop: stopTimer,
  } = useCountdownTimer({
    totalSeconds: totalTime,
    hapticCountdownSeconds: 5,
    onTimeUp: handleTimeUp,
  });

  const loadNewQuestion = useCallback(async () => {
    setError(false);
    try {
      const result = await loadNQuestions(drizzleDb, numberOfQuestions);
      if (result.length > 0) {
        setAllQuestions(result);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setError(true);
    }
  }, [drizzleDb, numberOfQuestions]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const onGuess = useCallback(
    (letter: "A" | "B" | "C" | "D", index: number) => {
      if (!isFinished) {
        setGuesses((prev) => {
          if (prev[index] === letter) return prev;
          if (remainingSeconds >= 6) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const newGuesses = [...prev];
          newGuesses[index] = letter;
          return newGuesses;
        });
      }
    },
    [isFinished, remainingSeconds],
  );

  const onPrev = useCallback(() => {
    if (currentIndex !== 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const onNext = useCallback(() => {
    if (currentIndex !== numberOfQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    if (remainingSeconds >= 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsConfirmModalOpen(true);
  }, [currentIndex, numberOfQuestions, remainingSeconds]);

  const restartTest = useCallback(() => {
    setIsOverviewModalOpen(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setGuesses(new Array(numberOfQuestions).fill(undefined));
    setAllQuestions(undefined);
    setError(false);
    restartTimer();
    loadNewQuestion();
  }, [loadNewQuestion, numberOfQuestions, restartTimer]);

  const handleConfirmFinish = useCallback(async () => {
    writeToDatabase(true, remainingSeconds);

    stopTimer();
    setIsFinished(true);
    setIsConfirmModalOpen(false);
    setIsOverviewModalOpen(true);
  }, [stopTimer, writeToDatabase, remainingSeconds]);

  const handleViewResults = useCallback(() => {
    setIsOverviewModalOpen(false);
    setCurrentIndex(0);
  }, []);

  // Calculate stats
  const correctCount = allQuestions
    ? guesses.filter((g, i) => g === allQuestions[i]?.answer).length
    : 0;
  const unansweredCount = guesses.filter((g) => g === undefined).length;

  if (!allQuestions) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <TimerHeader remainingSeconds={remainingSeconds} title="Test" />
        {error ? (
          <>
            <Text className="text-foreground text-lg mb-2">
              Ndodhi nje gabim
            </Text>
            <Pressable
              className="bg-primary p-3 rounded-md active:opacity-80 mt-2"
              onPress={() => {
                setError(false);
                loadNewQuestion();
              }}
            >
              <Text className="text-primary-foreground text-center font-semibold">
                Provo Përsëri
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator
            size="large"
            color={getThemeColor("--muted-foreground", theme)}
          />
        )}
      </View>
    );
  }

  const currentQuestion = allQuestions[currentIndex];
  const currentGuess = guesses[currentIndex];
  const isLastQuestion = currentIndex === allQuestions.length - 1;

  return (
    <View className="flex-1 bg-background justify-between">
      <TimerHeader title={"Test"} remainingSeconds={remainingSeconds} />

      <OverviewModal
        visible={isOverviewModalOpen}
        correctCount={correctCount}
        totalCount={numberOfQuestions}
        onNewTest={restartTest}
        onViewResults={handleViewResults}
      />

      <ConfirmModal
        visible={isConfirmModalOpen}
        unansweredCount={unansweredCount}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmFinish}
      />

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
          Pyetja {currentIndex + 1} / {numberOfQuestions} -{" "}
          {currentQuestion.exam_title}
        </Text>
        <MathText
          color={getThemeColor("--foreground", theme)}
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
        <View className="gap-3 mt-6">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const isCorrect = currentQuestion.answer === letter;
            const isSelected = currentGuess === letter;

            return (
              <Pressable
                key={letter}
                disabled={isFinished}
                className={cn(
                  "border-border bg-secondary border px-4 py-3 rounded-md active:opacity-80 justify-center",
                  !isFinished && isSelected && "bg-blue-600 border-blue-700",
                  isSelected &&
                    !isCorrect &&
                    isFinished &&
                    "bg-destructive border-destructive",
                  currentGuess &&
                    isCorrect &&
                    isFinished &&
                    "bg-green-600 border-green-700",
                )}
                onPress={() => onGuess(letter, currentIndex)}
              >
                <MathText
                  className={cn(
                    "text-foreground align-middle",
                    !isFinished && isSelected && "font-bold",
                    currentGuess && isCorrect && isFinished && "font-bold",
                  )}
                  text={`${
                    currentQuestion[
                      `option_${letter.toLowerCase()}` as keyof typeof currentQuestion
                    ]
                  }`}
                  color={getThemeColor("--foreground", theme)}
                  paddingHorizontal={HORIZONTAL_PADDING * 2 + 16 * 2 + 1}
                />
              </Pressable>
            );
          })}
        </View>
        {isFinished && (
          <View className="mt-4 p-4 bg-accent rounded-lg border border-accent/30">
            <Text className="text-accent-foreground font-bold mb-1">
              Shpjegimi:
            </Text>
            <MathText
              color={getThemeColor("--accent-foreground", theme, 0.9)}
              text={currentQuestion.explanation}
              className="text-accent-foreground/90 text-sm"
              fontSize={14}
              paddingHorizontal={HORIZONTAL_PADDING * 2 + 16 * 2 + 1}
            />
          </View>
        )}
      </ScrollView>

      <View className="p-6 border-t border-border bg-background flex-row gap-2">
        <Pressable
          className={cn(
            "bg-secondary p-4 flex-1 rounded-lg active:bg-secondary/90 flex-row gap-2 items-center",
            currentIndex === 0 && "bg-muted",
          )}
          onPress={onPrev}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={getThemeColor(
              currentIndex === 0 ? "--muted-foreground" : "--foreground",
              theme,
            )}
          />
          <Text
            className={cn(
              "font-semibold text-lg text-foreground align-center",
              currentIndex === 0 && "text-muted-foreground",
            )}
          >
            Kthehu
          </Text>
        </Pressable>
        <Pressable
          className={cn(
            "bg-secondary p-4 flex-1 rounded-lg active:bg-secondary/90 flex-row gap-2 items-center justify-end",
            isFinished && isLastQuestion
              ? "bg-muted active:bg-muted/90"
              : isLastQuestion && "bg-primary active:bg-primary/90",
          )}
          onPress={onNext}
          disabled={isFinished && isLastQuestion}
        >
          <Text
            className={cn(
              "font-semibold text-lg text-foreground align-center",
              isFinished && isLastQuestion
                ? "text-muted-foreground"
                : isLastQuestion && "text-primary-foreground",
            )}
          >
            {isLastQuestion && !isFinished ? "Perfundo" : "Perpara"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={22}
            color={getThemeColor(
              isFinished && isLastQuestion
                ? "--muted-foreground"
                : isLastQuestion
                  ? "--primary-foreground"
                  : "--foreground",
              theme,
            )}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Test;
