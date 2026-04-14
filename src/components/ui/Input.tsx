"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-white/60 mb-1.5 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-2xl bg-purple-mid sticker-border sticker-shadow-sm",
            "text-white placeholder:text-white/30",
            "transition-[box-shadow,border-color,transform] duration-150 ease-out",
            "focus:outline-none focus:border-bright-teal focus:shadow-[6px_6px_0_var(--color-ink)]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
