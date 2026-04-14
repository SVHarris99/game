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
            "w-full px-4 py-3 rounded-xl bg-purple-mid border border-white/10",
            "text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-bright-teal/50 focus:border-bright-teal",
            "transition-all duration-200",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
