"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { bouncySpring, spring } from "@/lib/motion";

const REVEAL_DELAY_MS = 3000;

export function Round3RevealPhase() {
  const { room, players, isHost } = useRoomContext();
  const { advanceAfterR3Reveal } = useGameActions();
  const advancedRef = useRef(false);

  const roomCode = room?.code;
  const phase = room?.phase;
  const currentPromptIndex = room?.round3CurrentPromptIndex ?? 0;
  const pointings = room?.round3Pointings?.[currentPromptIndex] ?? {};

  useEffect(() => {
    if (!isHost || !roomCode || phase !== "round3Reveal") return;
    if (advancedRef.current) return;
    advancedRef.current = true;

    const timer = setTimeout(() => {
      advanceAfterR3Reveal(roomCode).catch((err) => {
        console.error("advanceAfterR3Reveal failed", err);
        advancedRef.current = false;
      });
    }, REVEAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isHost, roomCode, phase, advanceAfterR3Reveal]);

  if (!room) return null;

  // Build an ordered list of pointing rows, following turnOrder for stable display.
  const rows = room.turnOrder
    .map((voterId) => {
      const voter = players.find((p) => p.id === voterId);
      if (!voter) return null;
      const targetId = pointings[voterId];
      const target =
        targetId && targetId.length > 0
          ? players.find((p) => p.id === targetId) ?? null
          : null;
      return { voter, target, hasTarget: !!targetId };
    })
    .filter(<T,>(x: T | null): x is T => x !== null);

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Header sticker */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={bouncySpring}
        className="mb-6 px-6 py-3 bg-sticker-violet sticker-border-thick sticker-shadow rounded-2xl"
      >
        <h2 className="font-display font-bold text-xl sm:text-2xl uppercase text-white tracking-tight">
          Prompt {currentPromptIndex + 1} of 3 Complete
        </h2>
      </motion.div>

      <p className="font-display font-semibold text-white/60 uppercase tracking-wider text-xs mb-4">
        Who pointed at whom
      </p>

      <div className="w-full max-w-sm space-y-2">
        {rows.map((row, i) => (
          <motion.div
            key={row.voter.id}
            initial={{ opacity: 0, x: -14, rotate: -3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ ...spring, delay: i * 0.08 }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl sticker-border sticker-shadow-sm"
            style={{
              backgroundColor: "var(--color-purple-mid)",
              color: "#fff",
            }}
          >
            <PlayerAvatar
              name={row.voter.name}
              color={row.voter.avatarColor}
              size="sm"
            />
            <span className="font-display font-semibold text-sm truncate max-w-[6.5rem]">
              {row.voter.name}
            </span>
            <ArrowRight className="w-4 h-4 text-white/60 shrink-0" />
            {row.target ? (
              <>
                <PlayerAvatar
                  name={row.target.name}
                  color={row.target.avatarColor}
                  size="sm"
                />
                <span className="font-display font-semibold text-sm truncate">
                  {row.target.name}
                </span>
              </>
            ) : (
              <span className="font-display font-semibold text-sm italic text-white/60">
                no pick
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
