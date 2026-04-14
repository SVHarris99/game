"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { bouncySpring, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useSfx } from "@/lib/sfx/useSfx";

export function ResultsPhase() {
  const { room, players, isHost } = useRoomContext();
  const { playAgain, backToLobby } = useGameActions();
  const { play } = useSfx();
  const playedRef = useRef(false);

  const latestRound = room?.roundHistory[room.roundHistory.length - 1];
  const imposterCaught = latestRound?.imposterCaught ?? false;

  useEffect(() => {
    if (!room) return;
    if (playedRef.current) return;
    playedRef.current = true;
    play(imposterCaught ? "correct" : "wrong");
  }, [room, imposterCaught, play]);

  if (!room) return null;

  const imposter = players.find((p) => p.id === room.imposterId);

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

  const stampRotation = imposterCaught ? -6 : 8;
  const stampBg = imposterCaught
    ? "var(--color-bright-teal)"
    : "var(--color-paper)";
  const stampColor = "var(--color-ink)";
  const stampText = imposterCaught ? "Insiders Win!" : "Escaped!";

  return (
    <div className="flex-1 flex flex-col items-center w-full overflow-hidden">
      <Confetti trigger={imposterCaught} />

      {/* Rubber-stamp reveal */}
      <motion.div
        initial={{ scale: 3, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: stampRotation, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mb-8 mt-2 px-8 py-5 sticker-border-thick sticker-shadow-lg rounded-2xl"
        style={{ backgroundColor: stampBg }}
      >
        <h2
          className="font-display font-bold uppercase text-4xl sm:text-5xl tracking-tight"
          style={{ color: stampColor }}
        >
          {stampText}
        </h2>
      </motion.div>

      {/* Word reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: -2 }}
        transition={{ ...bouncySpring, delay: 0.4 }}
        className="mb-6 px-6 py-4 bg-sticker-yellow sticker-border-thick sticker-shadow rounded-2xl text-center max-w-xs"
        style={{ color: "var(--color-ink)" }}
      >
        <p className="font-display font-semibold text-xs uppercase tracking-wide opacity-70">
          The word was
        </p>
        <p className="font-display font-bold text-3xl sm:text-4xl uppercase mt-1 break-words">
          {room.currentWord}
        </p>
      </motion.div>

      {/* Imposter reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.7 }}
        className="mb-8 flex flex-col items-center"
      >
        <p className="font-display font-semibold text-sm text-white/60 uppercase tracking-wide mb-2">
          The imposter
        </p>
        <div className="relative">
          {imposter && (
            <div className="scale-150 mb-2">
              <PlayerAvatar
                name={imposter.name}
                color={imposter.avatarColor}
                size="lg"
              />
            </div>
          )}
          <motion.div
            initial={{ scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: -18, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 16,
              delay: 1.0,
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span
              className={cn(
                "font-display font-bold uppercase text-lg sm:text-xl px-3 py-1 border-[3px] rounded-md",
                imposterCaught
                  ? "bg-danger text-white border-white"
                  : "bg-bright-teal text-ink border-ink"
              )}
            >
              {imposterCaught ? "Caught!" : "Escaped"}
            </span>
          </motion.div>
        </div>
        <p className="font-display font-bold text-2xl mt-4 text-white">
          {imposter?.name ?? "Unknown"}
        </p>
      </motion.div>

      {/* Scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 1.2 }}
        className="w-full max-w-sm mb-6"
      >
        <p className="font-display font-semibold text-xs uppercase tracking-wide text-white/60 mb-2 text-center">
          Scoreboard
        </p>
        <div className="space-y-2">
          {sortedPlayers.map((player, i) => {
            const isFirst = i === 0;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20, rotate: -4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ ...spring, delay: 1.3 + i * 0.06 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl sticker-border-thick sticker-shadow-sm",
                  isFirst && "tilt-left"
                )}
                style={{
                  backgroundColor: isFirst
                    ? "var(--color-gold)"
                    : "var(--color-purple-mid)",
                  color: isFirst ? "var(--color-ink)" : "#fff",
                }}
              >
                <span className="font-display font-bold text-lg w-6 text-center">
                  {isFirst ? "👑" : i + 1}
                </span>
                <PlayerAvatar
                  name={player.name}
                  color={player.avatarColor}
                  size="sm"
                />
                <span className="font-display font-bold text-base truncate">
                  {player.name}
                </span>
                <span className="ml-auto font-display font-bold tabular-nums text-lg">
                  {room.scores[player.id] || 0}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="w-full max-w-sm flex gap-3"
        >
          <Button
            variant="secondary"
            className="flex-1 font-display font-bold uppercase"
            onClick={handleBackToLobby}
          >
            Lobby
          </Button>
          <Button
            className="flex-1 font-display font-bold uppercase"
            onClick={handlePlayAgain}
          >
            Play Again
          </Button>
        </motion.div>
      )}

      {!isHost && (
        <p className="font-display font-semibold text-white/50 text-sm mt-4">
          Waiting for host…
        </p>
      )}
    </div>
  );
}
