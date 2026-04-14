"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  duration: number; // seconds
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useCountdown({
  duration,
  onComplete,
  autoStart = false,
}: UseCountdownOptions) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const start = useCallback(() => {
    setSecondsLeft(duration);
    setIsRunning(true);
  }, [duration]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSecondsLeft(duration);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      if (isRunning && secondsLeft <= 0) {
        setIsRunning(false);
        onCompleteRef.current?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  return { secondsLeft, isRunning, start, stop, reset };
}
