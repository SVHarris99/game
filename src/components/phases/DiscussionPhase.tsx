"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

export function DiscussionPhase() {
  const { room, players, isHost } = useRoomContext();
  const { advanceToVoting } = useGameActions();

  const { secondsLeft } = useCountdown({
    duration: 120,
    autoStart: true,
    onComplete: async () => {
      if (isHost && room) {
        await advanceToVoting(room.code);
      }
    },
  });

  if (!room) return null;

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="text-center mb-6">
        <MessageCircle className="w-10 h-10 text-bright-teal mx-auto mb-2" />
        <h2 className="text-2xl font-bold mb-1">Discussion Time</h2>
        <p className="text-white/40 text-sm">
          Talk it out. Who seems suspicious?
        </p>
      </div>

      <Timer secondsLeft={secondsLeft} totalSeconds={120} size="lg" />

      {/* Clue recap */}
      <div className="w-full max-w-sm mt-8">
        <p className="text-sm text-white/40 mb-3">Clue Recap</p>
        <div className="space-y-2">
          {room.turnOrder.map((pid) => {
            const player = players.find((p) => p.id === pid);
            if (!player) return null;
            return (
              <motion.div
                key={pid}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-mid/30"
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.avatarColor}
                  size="sm"
                />
                <span className="text-white/60">{player.name}</span>
                <span className="ml-auto font-bold">{room.clues[pid]}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isHost && (
        <button
          onClick={() => advanceToVoting(room.code)}
          className="mt-6 text-sm text-white/30 underline hover:text-white/50 transition-colors"
        >
          Skip to voting
        </button>
      )}
    </div>
  );
}
