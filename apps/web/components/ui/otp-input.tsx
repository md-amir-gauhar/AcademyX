"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onComplete?: (value: string) => void;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  className,
  onComplete,
}: OTPInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastFiredRef = React.useRef<string | null>(null);
  const onCompleteRef = React.useRef(onComplete);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  // Fire onComplete exactly once per unique completed value. We deliberately
  // latch the last-fired value in a ref so that prop identity churn (e.g. a
  // parent re-rendering with a new onComplete reference) does not re-trigger
  // the callback while the input is still at full length.
  React.useEffect(() => {
    if (value.length === length && lastFiredRef.current !== value) {
      lastFiredRef.current = value;
      onCompleteRef.current?.(value);
    } else if (value.length < length) {
      lastFiredRef.current = null;
    }
  }, [value, length]);

  const setDigit = (idx: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(0, 1);
    const arr = value.split("");
    arr[idx] = clean;
    const next = arr.join("").slice(0, length);
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[idx]) {
        setDigit(idx, "");
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        setDigit(idx - 1, "");
      }
      return;
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const raw = e.target.value;
    if (raw.length > 1) {
      // Autofill / paste mid-input
      const digits = raw.replace(/\D/g, "").slice(0, length);
      onChange(digits.padEnd(value.length, "").slice(0, length));
      inputsRef.current[Math.min(digits.length, length - 1)]?.focus();
      return;
    }
    setDigit(idx, raw);
    if (raw && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    inputsRef.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "h-14 w-12 sm:h-16 sm:w-14 rounded-2xl border border-border bg-background/60 text-center text-xl sm:text-2xl font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "transition-all",
            value[i] && "border-primary/60 bg-primary/5",
            disabled && "opacity-60"
          )}
        />
      ))}
    </div>
  );
}
