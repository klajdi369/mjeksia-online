import { questions } from "@/services/db/schema";
import { InferSelectModel } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useCountdownTimer } from "./useCountdownTimer";

const isWeb = Platform.OS === "web";

function hapticImpact(style: Haptics.ImpactFeedbackStyle) {
  if (!isWeb) {
    Haptics.impactAsync(style);
  }
}

type Question = InferSelectModel<typeof questions>;
type Guess = "A" | "B" | "C" | "D" | undefined;

interface UseTestEngineOptions {
  questions: Question[] | undefined;
  totalTime: number;
  onSaveResult: (
    questions: Question[],
    guesses: Guess[],
    completed: boolean,
    timeLeft: number,
    answeredAt: (number | null)[],
    timeSpent: number[],
  ) => Promise<void>;
  onRestart?: () => void;
}

interface UseTestEngineReturn {
  // State
  guesses: Guess[];
  currentIndex: number;
  isFinished: boolean;
  remainingSeconds: number;
  isConfirmModalOpen: boolean;
  isOverviewModalOpen: boolean;

  // Derived
  currentQuestion: Question | undefined;
  currentGuess: Guess;
  isLastQuestion: boolean;
  correctCount: number;
  unansweredCount: number;
  totalCount: number;

  // Actions
  onGuess: (letter: "A" | "B" | "C" | "D", index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  restartTest: () => void;
  handleConfirmFinish: () => void;
  handleViewResults: () => void;
  setIsConfirmModalOpen: (open: boolean) => void;
}

export const useTestEngine = ({
  questions: allQuestions,
  totalTime,
  onSaveResult,
  onRestart,
}: UseTestEngineOptions): UseTestEngineReturn => {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [answeredAt, setAnsweredAt] = useState<(number | null)[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);

  // Sync guesses array length when questions change
  const questionCount = allQuestions?.length ?? 0;
  const [prevQuestionCount, setPrevQuestionCount] = useState(0);
  if (questionCount !== prevQuestionCount) {
    setPrevQuestionCount(questionCount);
    if (questionCount > 0) {
      setGuesses(new Array(questionCount).fill(undefined));
      setAnsweredAt(new Array(questionCount).fill(null));
      setTimeSpent(new Array(questionCount).fill(0));
    }
  }

  const writeToDatabase = useCallback(
    async (completed: boolean, timeLeft: number) => {
      if (!allQuestions || allQuestions.length === 0) return;
      await onSaveResult(
        allQuestions,
        guesses,
        completed,
        timeLeft,
        answeredAt,
        timeSpent,
      );
    },
    [allQuestions, guesses, onSaveResult, answeredAt, timeSpent],
  );

  // Handle time up
  const handleTimeUp = useCallback(
    (timeLeft: number) => {
      setIsFinished(true);
      setIsConfirmModalOpen(false);
      setIsOverviewModalOpen(true);
      writeToDatabase(false, timeLeft);
    },
    [writeToDatabase],
  );

  const onTick = useCallback(() => {
    if (!isFinished && !isOverviewModalOpen && questionCount > 0) {
      setTimeSpent((prev) => {
        const newTimeSpent = [...prev];
        newTimeSpent[currentIndex] = (newTimeSpent[currentIndex] || 0) + 1;
        return newTimeSpent;
      });
    }
  }, [currentIndex, isFinished, isOverviewModalOpen, questionCount]);

  const {
    remainingSeconds,
    restart: restartTimer,
    stop: stopTimer,
  } = useCountdownTimer({
    totalSeconds: totalTime,
    hapticCountdownSeconds: 5,
    onTimeUp: handleTimeUp,
    onTick,
  });

  const onGuess = useCallback(
    (letter: "A" | "B" | "C" | "D", index: number) => {
      if (!isFinished) {
        setGuesses((prev) => {
          if (prev[index] === letter) return prev;
          if (remainingSeconds >= 6) {
            hapticImpact(Haptics.ImpactFeedbackStyle.Light);
          }
          const newGuesses = [...prev];
          newGuesses[index] = letter;
          return newGuesses;
        });
        setAnsweredAt((prev) => {
          if (prev[index] !== null) return prev;
          const newAnsweredAt = [...prev];
          newAnsweredAt[index] = remainingSeconds;
          return newAnsweredAt;
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
    if (!allQuestions) return;
    if (currentIndex !== allQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    if (remainingSeconds >= 6) {
      hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsConfirmModalOpen(true);
  }, [currentIndex, allQuestions, remainingSeconds]);

  const restartTest = useCallback(() => {
    setIsOverviewModalOpen(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setGuesses(new Array(questionCount).fill(undefined));
    setAnsweredAt(new Array(questionCount).fill(null));
    setTimeSpent(new Array(questionCount).fill(0));
    restartTimer();
    onRestart?.();
  }, [questionCount, restartTimer, onRestart]);

  const handleConfirmFinish = useCallback(() => {
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

  // Derived values
  const correctCount = allQuestions
    ? guesses.filter((g, i) => g === allQuestions[i]?.answer).length
    : 0;
  const unansweredCount = guesses.filter((g) => g === undefined).length;
  const totalCount = allQuestions?.length ?? 0;
  const currentQuestion = allQuestions?.[currentIndex];
  const currentGuess = guesses[currentIndex];
  const isLastQuestion = allQuestions
    ? currentIndex === allQuestions.length - 1
    : false;

  return useMemo(
    () => ({
      guesses,
      currentIndex,
      isFinished,
      remainingSeconds,
      isConfirmModalOpen,
      isOverviewModalOpen,
      currentQuestion,
      currentGuess,
      isLastQuestion,
      correctCount,
      unansweredCount,
      totalCount,
      onGuess,
      onPrev,
      onNext,
      restartTest,
      handleConfirmFinish,
      handleViewResults,
      setIsConfirmModalOpen,
    }),
    [
      guesses,
      currentIndex,
      isFinished,
      remainingSeconds,
      isConfirmModalOpen,
      isOverviewModalOpen,
      currentQuestion,
      currentGuess,
      isLastQuestion,
      correctCount,
      unansweredCount,
      totalCount,
      onGuess,
      onPrev,
      onNext,
      restartTest,
      handleConfirmFinish,
      handleViewResults,
    ],
  );
};
