"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle2 } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";

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

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="text-center mb-6">
        <Vote className="w-10 h-10 text-bright-teal mx-auto mb-2" />
        <h2 className="text-2xl font-bold mb-1">Cast Your Vote</h2>
        <p className="text-white/40 text-sm">
          Who do you think is the imposter?
        </p>
        <p className="text-xs text-white/20 mt-1">
          {voteCount}/{totalPlayers} votes in
        </p>
      </div>

      {!hasVoted ? (
        <div className="w-full max-w-sm space-y-2 mb-6">
          {players
            .filter((p) => p.id !== user.uid)
            .map((player, i) => (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedId(player.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                  selectedId === player.id
                    ? "bg-danger/20 border-2 border-danger"
                    : "bg-purple-mid/30 border-2 border-transparent hover:border-white/10"
                }`}
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.avatarColor}
                  size="md"
                />
                <span className="font-medium text-lg">{player.name}</span>
                {selectedId === player.id && (
                  <CheckCircle2 className="w-5 h-5 text-danger ml-auto" />
                )}
              </motion.button>
            ))}

          <Button
            variant="danger"
            size="lg"
            className="w-full mt-4"
            onClick={handleVote}
            disabled={!selectedId || submitting}
          >
            {submitting ? "Voting..." : "Confirm Vote"}
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-bright-teal mx-auto mb-3" />
          <p className="text-white/50">Vote submitted!</p>
          <p className="text-white/30 text-sm mt-1">
            Waiting for everyone else...
          </p>
        </motion.div>
      )}
    </div>
  );
}
