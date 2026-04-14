import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
}

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        {
          "bg-purple-light": variant === "default",
          "bg-surface-elevated shadow-xl shadow-black/20":
            variant === "elevated",
          "bg-transparent border border-white/10": variant === "outlined",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
