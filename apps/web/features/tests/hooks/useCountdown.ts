"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountdownOptions {
  endTime?: number;
  durationSeconds?: number;
  startTime?: number;
  onExpire?: () => void;
}

export function useCountdown({
  endTime,
  durationSeconds,
  startTime,
  onExpire,
}: UseCountdownOptions) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    let endsAt: number;
    if (endTime != null) {
      endsAt = endTime;
    } else if (durationSeconds != null && startTime != null) {
      endsAt = startTime + durationSeconds * 1000;
    } else {
      return;
    }

    const remaining = Math.max(0, endsAt - Date.now());
    setTimeLeft(Math.floor(remaining / 1000));
  }, [endTime, durationSeconds, startTime]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const isExpired = timeLeft !== null && timeLeft <= 0;

  return { timeLeft: timeLeft ?? 0, isExpired } as const;
}
