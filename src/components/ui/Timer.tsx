"use client";

import { cn } from "@/lib/utils";

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: "sm" | "lg";
}

/**
 * Timer — sticker-styled circular countdown badge.
 *
 * Backgrounds:
 *  - size="sm": cream (`--color-paper`) interior, ink text → sticker badge look.
 *  - size="lg": keeps the darker purple interior for readability at large sizes.
 */
export function Timer({ secondsLeft, totalSeconds, size = "lg" }: TimerProps) {
  const progress = secondsLeft / totalSeconds;
  const isUrgent = secondsLeft <= 10;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display =
    minutes > 0
      ? `${minutes}:${secs.toString().padStart(2, "0")}`
      : `${secs}`;

  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full sticker-border sticker-shadow-sm",
        {
          "w-20 h-20": isSmall,
          "w-32 h-32": !isSmall,
        }
      )}
      style={{
        backgroundColor: isSmall
          ? "var(--color-paper)"
          : "var(--color-purple-light)",
      }}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className={cn(isSmall ? "text-ink/10" : "text-white/10")}
        />
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-linear", {
            "text-bright-teal": !isUrgent,
            "text-danger animate-pulse": isUrgent,
          })}
        />
      </svg>
      <span
        className={cn("font-display font-bold tabular-nums", {
          "text-xl": isSmall,
          "text-4xl": !isSmall,
          "text-danger": isUrgent,
          "text-ink": !isUrgent && isSmall,
          "text-white": !isUrgent && !isSmall,
        })}
      >
        {display}
      </span>
    </div>
  );
}
