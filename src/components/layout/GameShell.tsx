"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { SfxProvider } from "@/lib/sfx/useSfx";
import { MuteToggle } from "@/components/ui/MuteToggle";

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <SfxProvider>
      <MotionConfig reducedMotion="user">
        <div className="flex-1 flex flex-col min-h-dvh bg-transparent">
          {/* Top bar */}
          <header className="flex items-center justify-between px-4 py-3">
            <span className="font-display font-bold text-lg sm:text-xl uppercase tracking-wide text-white/90">
              The Odd One Out
            </span>
            <div id="shell-right" className="flex items-center gap-2">
              <MuteToggle />
            </div>
          </header>

          {/* Game content */}
          <main className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </MotionConfig>
    </SfxProvider>
  );
}
