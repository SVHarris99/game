"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useCountdown } from "@/hooks/useCountdown";
import { Timer } from "@/components/ui/Timer";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Input } from "@/components/ui/Input";

export function CluePhase() {
  const { room, players } = useRoomContext();
  const { user } = useAuth();
  const { submitClue } = useGameActions();
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!room || !user) return null;

  const activePlayerId = room.turnOrder[room.currentTurnIndex];
  const isMyTurn = activePlayerId === user.uid;
  const hasSubmitted = user.uid in room.clues;

  const handleSubmit = async () => {
    if (!clue.trim() || submitting || !isMyTurn) return;
    // Validate single word
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <p className="text-sm text-white/40 mb-1">Category</p>
        <p className="text-xl font-bold text-bright-teal">
          {room.currentCategory}
        </p>
      </div>

      {/* Clue list */}
      <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
        {room.turnOrder.map((pid, idx) => {
          const player = players.find((p) => p.id === pid);
          if (!player) return null;
          const playerClue = room.clues[pid];
          const isCurrent = idx === room.currentTurnIndex;
          const isComplete = pid in room.clues;

          return (
            <motion.div
              key={pid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isCurrent
                  ? "bg-bright-teal/10 border border-bright-teal/30"
                  : "bg-purple-mid/30"
              }`}
            >
              <PlayerAvatar
                name={player.name}
                color={player.avatarColor}
                size="sm"
                isActive={isCurrent}
              />
              <span
                className={`font-medium ${isCurrent ? "text-bright-teal" : "text-white/60"}`}
              >
                {player.name}
              </span>
              <span className="ml-auto">
                {isComplete ? (
                  <span className="font-bold text-white">{playerClue}</span>
                ) : isCurrent ? (
                  <ClueTimer roomCode={room.code} playerId={pid} />
                ) : (
                  <span className="text-white/20">...</span>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Input area */}
      {isMyTurn && !hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Input
            placeholder="One word clue..."
            value={clue}
            onChange={(e) => {
              // Only allow single word (no spaces)
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
            className="bg-bright-teal text-deep-purple p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {hasSubmitted && !isMyTurn && (
        <p className="text-center text-white/30 text-sm">
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
      // Auto-submit "SKIP" if timer runs out (host handles)
      try {
        await submitClue(roomCode, playerId, "---");
      } catch {
        // ignore if not authorized
      }
    },
  });

  return (
    <Timer secondsLeft={secondsLeft} totalSeconds={30} size="sm" />
  );
}
