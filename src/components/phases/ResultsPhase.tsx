"use client";

import { motion } from "framer-motion";
import { Trophy, ShieldAlert, RotateCcw, Home } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";

export function ResultsPhase() {
  const { room, players, isHost } = useRoomContext();
  const { playAgain, backToLobby } = useGameActions();

  if (!room) return null;

  const latestRound = room.roundHistory[room.roundHistory.length - 1];
  const imposter = players.find((p) => p.id === room.imposterId);
  const imposterCaught = latestRound?.imposterCaught ?? false;

  // Tally votes for display
  const voteTally: Record<string, number> = {};
  for (const targetId of Object.values(room.votes)) {
    voteTally[targetId] = (voteTally[targetId] || 0) + 1;
  }

  // Sort players by score
  const sortedPlayers = [...players].sort(
    (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
  );

  const handlePlayAgain = async () => {
    await playAgain(room.code, players);
  };

  const handleBackToLobby = async () => {
    await backToLobby(room.code);
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Win announcement */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center mb-6"
      >
        {imposterCaught ? (
          <>
            <Trophy className="w-14 h-14 text-gold mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-bright-teal">
              Insiders Win!
            </h2>
            <p className="text-white/50 mt-1">The imposter was caught</p>
          </>
        ) : (
          <>
            <ShieldAlert className="w-14 h-14 text-danger mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-danger">Imposter Wins!</h2>
            <p className="text-white/50 mt-1">
              The imposter got away with it
            </p>
          </>
        )}
      </motion.div>

      {/* Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm bg-purple-mid/50 rounded-2xl p-4 mb-4 text-center"
      >
        <p className="text-sm text-white/40">The word was</p>
        <p className="text-2xl font-bold text-bright-teal">
          {room.currentWord}
        </p>
        <p className="text-sm text-white/40 mt-2">The imposter was</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          {imposter && (
            <PlayerAvatar
              name={imposter.name}
              color={imposter.avatarColor}
              size="sm"
            />
          )}
          <span className="text-lg font-bold text-danger">
            {imposter?.name ?? "Unknown"}
          </span>
        </div>
      </motion.div>

      {/* Vote results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm mb-4"
      >
        <p className="text-sm text-white/40 mb-2">Vote Results</p>
        <div className="space-y-1.5">
          {players.map((player) => {
            const votes = voteTally[player.id] || 0;
            const isImposter = player.id === room.imposterId;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                  isImposter ? "bg-danger/10 border border-danger/30" : "bg-purple-mid/30"
                }`}
              >
                <PlayerAvatar
                  name={player.name}
                  color={player.avatarColor}
                  size="sm"
                />
                <span className="text-sm">{player.name}</span>
                {isImposter && (
                  <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                )}
                <span className="ml-auto font-bold tabular-nums">
                  {votes} vote{votes !== 1 ? "s" : ""}
                </span>
                {latestRound && (
                  <span
                    className={`text-xs font-bold ${
                      (latestRound.scoreDeltas[player.id] || 0) > 0
                        ? "text-gold"
                        : "text-white/20"
                    }`}
                  >
                    +{latestRound.scoreDeltas[player.id] || 0}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full max-w-sm mb-6"
      >
        <p className="text-sm text-white/40 mb-2">Scoreboard</p>
        <div className="space-y-1.5">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-mid/20"
            >
              <span
                className={`text-sm font-bold w-5 text-center ${
                  i === 0 ? "text-gold" : "text-white/30"
                }`}
              >
                {i + 1}
              </span>
              <PlayerAvatar
                name={player.name}
                color={player.avatarColor}
                size="sm"
              />
              <span className="text-sm">{player.name}</span>
              <span className="ml-auto font-bold text-bright-teal tabular-nums">
                {room.scores[player.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="w-full max-w-sm flex gap-3"
        >
          <Button variant="secondary" className="flex-1" onClick={handleBackToLobby}>
            <Home className="w-4 h-4 mr-2 inline" />
            Lobby
          </Button>
          <Button className="flex-1" onClick={handlePlayAgain}>
            <RotateCcw className="w-4 h-4 mr-2 inline" />
            Play Again
          </Button>
        </motion.div>
      )}

      {!isHost && (
        <p className="text-white/30 text-sm mt-4">
          Waiting for host...
        </p>
      )}
    </div>
  );
}
