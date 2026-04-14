"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSfx } from "@/lib/sfx/useSfx";
import { cn } from "@/lib/utils";

export function MuteToggle({ className }: { className?: string }) {
  const { muted, toggleMute } = useSfx();
  const label = muted ? "Unmute sounds" : "Mute sounds";

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-xl",
        "sticker-border sticker-shadow-sm sticker-press",
        "bg-sticker-yellow text-ink",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bright-teal/50",
        className
      )}
    >
      {muted ? (
        <VolumeX className="w-5 h-5" aria-hidden />
      ) : (
        <Volume2 className="w-5 h-5" aria-hidden />
      )}
    </button>
  );
}
