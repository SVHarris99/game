"use client";

import { cn } from "@/lib/utils";

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: "sm" | "lg";
}

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

  return (
    <div
      className={cn("relative flex items-center justify-center", {
        "w-20 h-20": size === "sm",
        "w-32 h-32": size === "lg",
      })}
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
          className="text-white/10"
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
        className={cn("font-bold tabular-nums", {
          "text-xl": size === "sm",
          "text-4xl": size === "lg",
          "text-danger": isUrgent,
          "text-white": !isUrgent,
        })}
      >
        {display}
      </span>
    </div>
  );
}
