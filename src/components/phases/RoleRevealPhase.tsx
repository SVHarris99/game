"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { bouncySpring } from "@/lib/motion";

export function RoleRevealPhase() {
  const { room, mySecret, isHost } = useRoomContext();
  const { advanceToClue } = useGameActions();
  const [revealed, setRevealed] = useState(false);

  const { secondsLeft } = useCountdown({
    duration: 5,
    autoStart: true,
    onComplete: () => setRevealed(true),
  });

  const handleContinue = async () => {
    if (!room || !isHost) return;
    await advanceToClue(room.code);
  };

  if (!room) return null;

  const isImposter = mySecret?.role === "imposter";

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center"
          >
            <p className="font-display font-semibold text-white/70 mb-6 text-xl uppercase tracking-wide">
              Revealing your role in...
            </p>
            <Timer secondsLeft={secondsLeft} totalSeconds={5} size="lg" />
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center max-w-sm w-full px-4"
          >
            {mySecret && !isImposter ? (
              <div className="space-y-5">
                <p className="font-display font-semibold text-white/70 text-lg uppercase tracking-wide">
                  You&apos;re in the know
                </p>

                <div className="flex justify-center">
                  <CategoryChip category={mySecret.category} />
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -2 }}
                  transition={bouncySpring}
                  className="sticker-border-thick sticker-shadow-lg rounded-3xl p-8 mx-auto"
                  style={{ backgroundColor: "var(--color-paper)" }}
                >
                  <p className="font-display font-semibold text-ink/60 uppercase text-sm tracking-wider mb-3">
                    Secret word
                  </p>
                  <p className="font-display font-bold text-ink text-5xl leading-tight break-words">
                    {mySecret.word}
                  </p>
                </motion.div>
              </div>
            ) : mySecret && isImposter ? (
              <div className="space-y-5">
                <p className="font-display font-semibold text-white/70 text-lg uppercase tracking-wide">
                  Uh oh...
                </p>

                <motion.div
                  initial={{ scale: 0, rotate: 12 }}
                  animate={{ scale: 1, rotate: 2 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 11,
                  }}
                  className="sticker-border-thick sticker-shadow-lg rounded-3xl p-8 mx-auto"
                  style={{ backgroundColor: "var(--color-danger)" }}
                >
                  <p className="font-display font-bold text-white text-4xl uppercase leading-tight">
                    You&apos;re the imposter
                  </p>
                  <p className="mt-4 text-white/90 text-base">
                    Blend in. Find the category. Don&apos;t get caught.
                  </p>
                </motion.div>
              </div>
            ) : (
              <p className="text-white/50">Loading your role...</p>
            )}

            {isHost && mySecret && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-10"
              >
                <Button variant="primary" size="lg" onClick={handleContinue}>
                  Continue
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
