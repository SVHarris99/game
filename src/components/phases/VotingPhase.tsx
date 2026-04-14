"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";
import { bouncySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STICKER_BGS = [
  "var(--color-sticker-pink)",
  "var(--color-sticker-blue)",
  "var(--color-sticker-yellow)",
  "var(--color-sticker-lime)",
  "var(--color-sticker-orange)",
  "var(--color-sticker-violet)",
];

export function VotingPhase() {
  const { room, players, isHost } = useRoomContext();
  const { user } = useAuth();
  const { submitVote, revealResults } = useGameActions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!room || !user) return null;

  const hasVoted = user.uid in room.votes;
  const voteCount = Object.keys(room.votes).length;
  const totalPlayers = players.length;
  const allVoted = voteCount >= totalPlayers;

  const handleVote = async () => {
    if (!selectedId || submitting || hasVoted) return;
    setSubmitting(true);
    try {
      await submitVote(room.code, user.uid, selectedId);
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReveal = async () => {
    if (!isHost) return;
    try {
      await revealResults(
        room.code,
        players.map((p) => p.id)
      );
    } catch (err) {
      console.error("Failed to reveal:", err);
    }
  };

  // Auto-reveal when all votes are in (host triggers)
  if (allVoted && isHost && !room.votingComplete) {
    handleReveal();
  }

  const votableCandidates = players.filter((p) => p.id !== user.uid);

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Header sticker */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={bouncySpring}
        className="mb-3 px-6 py-3 bg-danger sticker-border-thick sticker-shadow rounded-2xl"
      >
        <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase text-white tracking-tight">
          Who&apos;s the Imposter?
        </h2>
      </motion.div>

      <p className="font-display font-semibold text-sm text-white/60 mb-6 tabular-nums">
        {voteCount} of {totalPlayers} voted
      </p>

      {!hasVoted ? (
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {votableCandidates.map((player, i) => {
              const selected = selectedId === player.id;
              const bg = STICKER_BGS[i % STICKER_BGS.length];
              const tiltClass = i % 2 === 0 ? "tilt-left" : "tilt-right";
              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, scale: 0, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ ...bouncySpring, delay: i * 0.06 }}
                  onClick={() => setSelectedId(player.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-2xl sticker-border-thick sticker-shadow sticker-press",
                    !selected && tiltClass
                  )}
                  style={{
                    backgroundColor: selected ? "var(--color-danger)" : bg,
                  }}
                >
                  <PlayerAvatar
                    name={player.name}
                    color={player.avatarColor}
                    size="lg"
                  />
                  <span
                    className="font-display font-bold text-sm truncate max-w-full"
                    style={{
                      color: selected ? "#fff" : "var(--color-ink)",
                    }}
                  >
                    {player.name}
                  </span>

                  {selected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: -12 }}
                      transition={bouncySpring}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <span
                        className="font-display font-bold text-white uppercase text-lg px-3 py-1 border-[3px] border-white rounded-md bg-danger/80"
                        style={{ transform: "rotate(-12deg)" }}
                      >
                        Suspect!
                      </span>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <Button
            variant="danger"
            size="lg"
            className="w-full font-display font-bold uppercase tracking-wide"
            onClick={handleVote}
            disabled={!selectedId || submitting}
          >
            {submitting ? "Voting..." : "Confirm Vote"}
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 2 }}
          transition={bouncySpring}
          className="px-6 py-5 bg-sticker-yellow sticker-border-thick sticker-shadow rounded-2xl text-center"
          style={{ color: "var(--color-ink)" }}
        >
          <p className="font-display font-bold uppercase text-lg">
            Vote locked in!
          </p>
          <p className="font-display font-semibold text-sm mt-1">
            Waiting for votes
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="inline-block ml-0.5"
            >
              …
            </motion.span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
