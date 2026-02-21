import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownTimerOptions {
  totalSeconds: number;
  hapticCountdownSeconds?: number;
  onTimeUp?: (remainingSeconds: number) => void;
}

interface UseCountdownTimerReturn {
  remainingSeconds: number;
  restart: () => void;
  stop: () => void;
  isRunning: boolean;
}

export const useCountdownTimer = ({
  totalSeconds,
  hapticCountdownSeconds = 5,
  onTimeUp,
}: UseCountdownTimerOptions): UseCountdownTimerReturn => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [timerKey, setTimerKey] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the callback ref updated without triggering effect re-runs
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);

          onTimeUpRef.current?.(remainingSeconds);

          return 0;
        }

        const newValue = s - 1;

        if (newValue >= 1 && newValue <= hapticCountdownSeconds) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        return newValue;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerKey, totalSeconds, hapticCountdownSeconds]);

  const restart = useCallback(() => {
    setTimerKey((k) => k + 1);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
  }, []);

  return { remainingSeconds, restart, stop, isRunning };
};
