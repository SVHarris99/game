"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useDebug, isBot } from "@/hooks/useDebug";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";
import { Input } from "@/components/ui/Input";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { bouncySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Cycle clue-card backgrounds by index — visual rhythm, not by speaker.
const STICKER_COLORS = [
  "var(--color-sticker-pink)",
  "var(--color-sticker-blue)",
  "var(--color-sticker-yellow)",
  "var(--color-sticker-lime)",
  "var(--color-sticker-orange)",
  "var(--color-sticker-violet)",
];

const BOT_CLUES = [
  "hmm", "yup", "vibes", "kinda", "sorta", "maybe", "ish", "cool",
  "cozy", "zoom", "beep", "fluffy", "spicy", "crunchy", "smooth",
];

export function CluePhase() {
  const { room, players, isHost } = useRoomContext();
  const { user } = useAuth();
  const { submitClue } = useGameActions();
  const debug = useDebug();
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activePlayerId = room?.turnOrder[room.currentTurnIndex];
  const currentIsBot = !!activePlayerId && isBot(activePlayerId);
  const clueSubmittedForActive = !!(
    room && activePlayerId && activePlayerId in room.clues
  );

  // Host drives bot clues in debug mode
  useEffect(() => {
    if (!debug || !isHost || !room || !currentIsBot || clueSubmittedForActive)
      return;
    const timer = setTimeout(() => {
      const fake = BOT_CLUES[Math.floor(Math.random() * BOT_CLUES.length)];
      submitClue(room.code, activePlayerId, fake).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [
    debug,
    isHost,
    room,
    activePlayerId,
    currentIsBot,
    clueSubmittedForActive,
    submitClue,
  ]);

  if (!room || !user) return null;

  const isMyTurn = activePlayerId === user.uid;
  const hasSubmitted = user.uid in room.clues;
  const activePlayer = players.find((p) => p.id === activePlayerId);

  const handleSubmit = async () => {
    if (!clue.trim() || submitting || !isMyTurn) return;
    const trimmed = clue.trim();
    if (trimmed.includes(" ")) return;
    setSubmitting(true);
    try {
      await submitClue(room.code, user.uid, trimmed);
      setClue("");
    } catch (err) {
      console.error("Failed to submit clue:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Only render clues that have been submitted, in turn order.
  const submittedEntries = room.turnOrder
    .map((pid) => {
      const player = players.find((p) => p.id === pid);
      const text = room.clues[pid];
      if (!player || !text) return null;
      return { pid, player, text };
    })
    .filter(<T,>(x: T | null): x is T => x !== null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Category hero */}
      <div className="text-center mb-5">
        <p className="font-display font-semibold text-white/70 uppercase tracking-wider text-sm mb-2">
          Category
        </p>
        <div className="flex justify-center">
          <CategoryChip
            category={room.currentCategory}
            className="text-xl px-5 py-3"
          />
        </div>
      </div>

      {/* Turn indicator with timer */}
      <div className="relative flex items-center justify-center mb-5 px-2">
        <p className="font-display font-semibold text-white text-lg text-center">
          Turn {room.currentTurnIndex + 1} of {room.turnOrder.length}
          <span className="block text-white/60 text-base font-medium">
            {activePlayer ? `${activePlayer.name}'s turn` : "..."}
          </span>
        </p>
        {!hasSubmitted && activePlayerId && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ClueTimer roomCode={room.code} playerId={activePlayerId} />
          </div>
        )}
      </div>

      {/* Clue cards list */}
      <div className="flex-1 space-y-4 mb-5 overflow-y-auto px-1 py-2">
        {submittedEntries.length === 0 ? (
          <p className="text-center text-white/40 italic mt-6">
            No clues yet — waiting for the first clue...
          </p>
        ) : (
          submittedEntries.map((entry, idx) => {
            const color = STICKER_COLORS[idx % STICKER_COLORS.length];
            const tiltClass = idx % 2 === 0 ? "tilt-left" : "tilt-right";
            return (
              <motion.div
                key={entry.pid}
                initial={{ opacity: 0, scale: 0, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  ...bouncySpring,
                  delay: idx * 0.08,
                }}
              >
                <div
                  className={cn(
                    "sticker-border sticker-shadow rounded-3xl px-5 py-4",
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
          })
        )}
      </div>

      {/* Input area */}
      {isMyTurn && !hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 items-stretch"
        >
          <Input
            placeholder="One word clue..."
            value={clue}
            onChange={(e) => {
              const val = e.target.value.replace(/\s/g, "");
              setClue(val);
            }}
            maxLength={20}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!clue.trim() || submitting}
            aria-label="Send clue"
            className={cn(
              "shrink-0 flex items-center gap-2 px-5 rounded-2xl",
              "bg-bright-teal text-ink font-display font-bold uppercase",
              "sticker-border sticker-shadow-sm sticker-press",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bright-teal/50"
            )}
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </motion.div>
      )}

      {!isMyTurn && !hasSubmitted && (
        <p className="text-center text-white/50 text-base font-display font-medium">
          Waiting for {activePlayer?.name ?? "the current player"} to clue...
        </p>
      )}

      {hasSubmitted && !isMyTurn && (
        <p className="text-center text-white/50 text-base font-display font-medium">
          Waiting for other players...
        </p>
      )}
    </div>
  );
}

function ClueTimer({
  roomCode,
  playerId,
}: {
  roomCode: string;
  playerId: string;
}) {
  const { submitClue } = useGameActions();
  const { secondsLeft } = useCountdown({
    duration: 30,
    autoStart: true,
    onComplete: async () => {
      try {
        await submitClue(roomCode, playerId, "---");
      } catch {
        // ignore if not authorized
      }
    },
  });

  return <Timer secondsLeft={secondsLeft} totalSeconds={30} size="sm" />;
}
