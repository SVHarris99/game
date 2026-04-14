"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { updateDoc, serverTimestamp } from "firebase/firestore";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { roomRef } from "@/lib/firebase/firestore";
import { bouncySpring, spring } from "@/lib/motion";

const INTERMISSION_DELAY_MS = 3000;

export function RoundIntermissionPhase() {
  const { room, isHost } = useRoomContext();
  const { advanceToClue } = useGameActions();
  const advancedRef = useRef(false);

  const roundNumber = room?.roundNumber ?? 0;
  const roomCode = room?.code;
  const phase = room?.phase;

  useEffect(() => {
    if (!isHost || !roomCode || phase !== "roundIntermission") return;
    if (advancedRef.current) return;
    advancedRef.current = true;

    const timer = setTimeout(async () => {
      try {
        if (roundNumber === 2) {
          // R2 reuses the clue → discussion → voting → results flow.
          await advanceToClue(roomCode);
        } else if (roundNumber === 3) {
          // R3 enters its own prompt flow (Batch 3 will render the phase).
          await updateDoc(roomRef(roomCode), {
            phase: "round3Prompt",
            phaseStartedAt: serverTimestamp(),
          });
        } else {
          // Defensive fallback — shouldn't happen.
          await advanceToClue(roomCode);
        }
      } catch (err) {
        console.error("Failed to advance from roundIntermission", err);
        advancedRef.current = false;
      }
    }, INTERMISSION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isHost, roomCode, phase, roundNumber, advanceToClue]);

  if (!room) return null;

  const isR2 = roundNumber === 2;
  const title = isR2 ? "Round 2 — Fresh Angles" : "Round 3 — Point at the Person";
  const subcopy = isR2
    ? "No repeat clues. Turn order reversed."
    : "Physical round. Look around. Read the room.";
  const stampBg = isR2
    ? "var(--color-sticker-pink)"
    : "var(--color-sticker-violet)";
  const stampColor = isR2 ? "var(--color-ink)" : "#fff";
  const stampRotation = isR2 ? -6 : 6;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="mb-6"
      >
        <p className="font-display font-semibold text-white/60 uppercase tracking-widest text-sm text-center">
          Imposter escaped
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 2.2, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: stampRotation, opacity: 1 }}
        transition={bouncySpring}
        className="px-7 py-6 sticker-border-thick sticker-shadow-lg rounded-2xl text-center max-w-sm"
        style={{ backgroundColor: stampBg, color: stampColor }}
      >
        <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-tight leading-tight">
          {title}
        </h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.5 }}
        className="mt-8 font-display font-semibold text-white text-lg text-center max-w-xs"
      >
        {subcopy}
      </motion.p>

      {!isHost && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-6 font-display font-medium text-white/50 text-sm"
        >
          Get ready…
        </motion.p>
      )}
    </div>
  );
}
