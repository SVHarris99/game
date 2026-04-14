"use client";

import { useRoomContext } from "@/providers/RoomProvider";
import { Hash } from "lucide-react";
import type { ReactNode } from "react";

export function GameShell({ children }: { children: ReactNode }) {
  const { room } = useRoomContext();

  return (
    <div className="flex-1 flex flex-col min-h-dvh">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-bright-teal" />
          <span className="font-mono font-bold text-bright-teal tracking-widest">
            {room?.code}
          </span>
        </div>
        {room && room.roundNumber > 0 && (
          <span className="text-sm text-white/40">
            Round {room.roundNumber}
          </span>
        )}
      </header>

      {/* Game content */}
      <main className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
