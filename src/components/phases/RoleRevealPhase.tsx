"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";

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
            <p className="text-white/50 mb-6 text-lg">
              Revealing your role in...
            </p>
            <Timer secondsLeft={secondsLeft} totalSeconds={5} size="lg" />
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-center max-w-sm w-full"
          >
            {mySecret?.role === "imposter" ? (
              <div className="space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <ShieldAlert className="w-16 h-16 text-danger mx-auto" />
                </motion.div>
                <div className="bg-danger/10 border border-danger/30 rounded-3xl p-8">
                  <p className="text-sm text-white/50 mb-1">CATEGORY</p>
                  <p className="text-2xl font-bold text-white mb-4">
                    {mySecret.category}
                  </p>
                  <p className="text-3xl font-bold text-danger">
                    YOU ARE THE IMPOSTER
                  </p>
                  <p className="text-sm text-white/40 mt-3">
                    Blend in. Don&apos;t get caught.
                  </p>
                </div>
              </div>
            ) : mySecret ? (
              <div className="space-y-4">
                <Eye className="w-16 h-16 text-bright-teal mx-auto" />
                <div className="bg-bright-teal/10 border border-bright-teal/30 rounded-3xl p-8">
                  <p className="text-sm text-white/50 mb-1">CATEGORY</p>
                  <p className="text-2xl font-bold text-white mb-4">
                    {mySecret.category}
                  </p>
                  <p className="text-sm text-white/50 mb-1">SECRET WORD</p>
                  <p className="text-4xl font-bold text-bright-teal">
                    {mySecret.word}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-white/50">Loading your role...</p>
            )}

            {isHost && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-8"
              >
                <button
                  onClick={handleContinue}
                  className="bg-bright-teal text-deep-purple font-semibold px-8 py-3 rounded-2xl active:scale-95 transition-transform"
                >
                  Start Clue Phase
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
