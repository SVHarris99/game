import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "sticker";
  tilt?: "left" | "right" | "none";
}

export function Card({
  variant = "default",
  tilt = "none",
  className,
  children,
  ...props
}: CardProps) {
  const isSticker = variant === "sticker";
  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        {
          "bg-purple-light": variant === "default",
          "bg-surface-elevated shadow-xl shadow-black/20":
            variant === "elevated",
          "bg-transparent border border-white/10": variant === "outlined",
          "bg-purple-light sticker-border sticker-shadow": isSticker,
        },
        isSticker && tilt === "left" && "tilt-left",
        isSticker && tilt === "right" && "tilt-right",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
