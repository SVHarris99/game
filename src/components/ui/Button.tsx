"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-display font-semibold rounded-2xl sticker-border sticker-shadow-sm sticker-press",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bright-teal/50",
        {
          "bg-bright-teal text-ink hover:bg-teal-dim": variant === "primary",
          "bg-sticker-yellow text-ink hover:brightness-95":
            variant === "secondary",
          "bg-danger text-white hover:bg-danger/90": variant === "danger",
          "bg-transparent text-white hover:bg-white/10": variant === "ghost",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
