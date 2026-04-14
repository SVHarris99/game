"use client";

import { motion } from "framer-motion";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";
import { Button } from "@/components/ui/Button";
import { bouncySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STICKER_COLORS = [
  "var(--color-sticker-pink)",
  "var(--color-sticker-blue)",
  "var(--color-sticker-yellow)",
  "var(--color-sticker-lime)",
  "var(--color-sticker-orange)",
  "var(--color-sticker-violet)",
];

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

  const clueEntries = room.turnOrder
    .map((pid) => {
      const player = players.find((p) => p.id === pid);
      const text = room.clues[pid];
      if (!player || !text) return null;
      return { pid, player, text };
    })
    .filter(<T,>(x: T | null): x is T => x !== null);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero: DISCUSS label + huge timer */}
      <motion.p
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={bouncySpring}
        className="font-display font-bold text-white uppercase text-4xl tracking-wider mb-5"
      >
        Discuss
      </motion.p>

      <motion.div
        initial={{ scale: 0, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={bouncySpring}
      >
        <Timer secondsLeft={secondsLeft} totalSeconds={120} size="lg" />
      </motion.div>

      <p className="mt-4 text-white/60 text-base text-center max-w-xs">
        Talk it out. Who seems suspicious?
      </p>

      {/* Clue recap — horizontally scrollable sticker cards */}
      <div className="w-full mt-8 mb-6">
        <p className="font-display font-semibold text-white/70 uppercase tracking-wider text-sm mb-3 text-center">
          Clue Recap
        </p>

        {clueEntries.length === 0 ? (
          <p className="text-center text-white/40 italic">No clues recorded.</p>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 -mx-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {clueEntries.map((entry, idx) => {
              const color = STICKER_COLORS[idx % STICKER_COLORS.length];
              const tiltClass = idx % 2 === 0 ? "tilt-left" : "tilt-right";
              return (
                <motion.div
                  key={entry.pid}
                  initial={{ opacity: 0, scale: 0, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ ...bouncySpring, delay: idx * 0.08 }}
                  className="shrink-0 snap-center"
                  style={{ width: "min(80vw, 260px)" }}
                >
                  <div
                    className={cn(
                      "sticker-border sticker-shadow rounded-3xl px-5 py-4 h-full",
                      tiltClass
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <p className="font-display font-medium text-ink text-2xl leading-tight break-words">
                      &ldquo;{entry.text}&rdquo;
                    </p>
                    <p className="mt-2 text-ink/70 text-sm font-medium">
                      — {entry.player.name}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {isHost && (
        <div className="mt-auto pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => advanceToVoting(room.code)}
          >
            Move to Voting
          </Button>
        </div>
      )}
    </div>
  );
}
