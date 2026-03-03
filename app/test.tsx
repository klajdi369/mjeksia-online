import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { OverviewModal } from "@/components/modals/OverviewModal";
import { NavigationButtons } from "@/components/NavigationButtons";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { TimerHeader } from "@/components/TimerHeader";
import { getThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useDrizzle } from "@/hooks/useDrizzle";
import { useTestEngine } from "@/hooks/useTestEngine";
import { loadNQuestions } from "@/services/db/questions";
import { questions } from "@/services/db/schema";
import { saveTestResult } from "@/services/db/tests";
import { getSetting } from "@/services/settings/settings";
import { InferSelectModel } from "drizzle-orm";
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
  const [totalTime] = useState(() => parseFloat(getSetting("test_time")) * 60);
  const [numberOfQuestions] = useState(() =>
    parseInt(getSetting("test_question_amount"), 10),
  );
  const { drizzleDb } = useDrizzle();
  const { scheme, theme } = useAppTheme();

  const [error, setError] = useState(false);
  const [allQuestions, setAllQuestions] = useState<
    InferSelectModel<typeof questions>[] | undefined
  >(undefined);

  const loadQuestions = useCallback(async () => {
    setError(false);
    try {
      const result = await loadNQuestions(drizzleDb, numberOfQuestions);
      if (result.length > 0) {
        setAllQuestions(result);
      }
    } catch (err) {
      console.error("Error fetching question:", err);
      setError(true);
    }
  }, [drizzleDb, numberOfQuestions]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const onSaveResult = useCallback(
    async (
      questions: InferSelectModel<
        typeof import("@/services/db/schema").questions
      >[],
      guesses: ("A" | "B" | "C" | "D" | undefined)[],
      completed: boolean,
      timeLeft: number,
    ) => {
      await saveTestResult(drizzleDb, questions, guesses, completed, timeLeft);
    },
    [drizzleDb],
  );

  const handleRestart = useCallback(() => {
    setAllQuestions(undefined);
    setError(false);
    loadQuestions();
  }, [loadQuestions]);

  const engine = useTestEngine({
    questions: allQuestions,
    totalTime,
    onSaveResult,
    onRestart: handleRestart,
  });

  if (!allQuestions) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <TimerHeader remainingSeconds={engine.remainingSeconds} title="Test" />
        {error ? (
          <>
            <Text className="text-foreground text-lg mb-2">
              Ndodhi nje gabim
            </Text>
            <Pressable
              className="bg-primary p-3 rounded-md active:opacity-80 mt-2"
              onPress={() => {
                setError(false);
                loadQuestions();
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
            color={getThemeColor("--muted-foreground", scheme, theme)}
          />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-between">
      <TimerHeader title={"Test"} remainingSeconds={engine.remainingSeconds} />
      <OverviewModal
        visible={engine.isOverviewModalOpen}
        correctCount={engine.correctCount}
        totalCount={engine.totalCount}
        onNewTest={engine.restartTest}
        onViewResults={engine.handleViewResults}
      />
      <ConfirmModal
        visible={engine.isConfirmModalOpen}
        unansweredCount={engine.unansweredCount}
        onCancel={() => engine.setIsConfirmModalOpen(false)}
        onConfirm={engine.handleConfirmFinish}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: 24,
        }}
      >
        <QuestionDisplay
          question={engine.currentQuestion!}
          selectedOption={engine.currentGuess}
          onOptionPress={(letter) =>
            engine.onGuess(letter, engine.currentIndex)
          }
          isRevealed={engine.isFinished}
          disabled={engine.isFinished}
          indexInfo={`Pyetja ${engine.currentIndex + 1} / ${engine.totalCount}`}
          horizontalPadding={HORIZONTAL_PADDING}
        />
      </ScrollView>
      <NavigationButtons
        onPrev={engine.onPrev}
        onNext={engine.onNext}
        prevDisabled={engine.currentIndex === 0}
        nextDisabled={engine.isFinished && engine.isLastQuestion}
        nextLabel={
          engine.isLastQuestion && !engine.isFinished ? "Perfundo" : "Perpara"
        }
        isNextPrimary={engine.isLastQuestion}
      />
    </View>
  );
};

export default Test;
