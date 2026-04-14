"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { bouncySpring } from "@/lib/motion";

export function LobbyPhase() {
  const { room, players, isHost } = useRoomContext();
  const { startGame } = useGameActions();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!room) return null;

  const canStart = players.length >= 3;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await startGame(room.code, players);
    } catch (err) {
      console.error("Failed to start game:", err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Room code sticker card */}
      <motion.div
        initial={{ scale: 0, rotate: 8 }}
        animate={{ scale: 1, rotate: 2 }}
        transition={bouncySpring}
        className="w-full max-w-sm mb-10"
      >
        <Card
          variant="sticker"
          tilt="right"
          role="button"
          tabIndex={0}
          aria-label={`Room code ${room.code}. Tap to copy.`}
          onClick={handleCopyCode}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCopyCode();
            }
          }}
          className="sticker-shadow-lg sticker-press cursor-pointer text-center"
          style={{
            backgroundColor: "var(--color-paper)",
            color: "var(--color-ink)",
          }}
        >
          <p className="font-display font-semibold text-xs sm:text-sm uppercase tracking-[0.25em] text-ink/70">
            Room Code
          </p>
          <p className="font-display font-bold text-6xl sm:text-7xl tracking-[0.2em] mt-2 leading-none">
            {room.code}
          </p>
          <p className="mt-3 text-xs sm:text-sm font-medium text-ink/60">
            {copied ? "copied!" : "(tap to copy)"}
          </p>
        </Card>
      </motion.div>

      {/* Players grid */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-baseline gap-2 mb-4 px-1">
          <span className="font-display font-semibold text-lg text-white">
            Players
          </span>
          <span className="text-sm text-white/50">({players.length}/8)</span>
          {!canStart && (
            <span className="ml-auto text-xs text-white/40">
              need {3 - players.length} more
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ scale: 0, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ ...bouncySpring, delay: i * 0.06 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-purple-light sticker-border sticker-shadow-sm"
            >
              <PlayerAvatar
                name={player.name}
                color={player.avatarColor}
                size="md"
                tilt
              />
              <span className="font-display font-semibold text-sm text-white text-center truncate max-w-full">
                {player.name}
              </span>
              {player.isHost && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink bg-bright-teal px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Start button / waiting state */}
      <div className="w-full max-w-sm mt-auto">
        {isHost ? (
          <Button
            size="lg"
            className="w-full inline-flex items-center justify-center gap-2 text-xl"
            onClick={handleStart}
            disabled={!canStart || starting}
          >
            <Play className="w-6 h-6" fill="currentColor" />
            {starting
              ? "STARTING..."
              : canStart
                ? "START GAME"
                : `NEED ${3 - players.length} MORE`}
          </Button>
        ) : (
          <p className="text-center font-display font-medium text-white/70 text-lg">
            waiting for the host
            <motion.span
              aria-hidden
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
            >
              …
            </motion.span>
          </p>
        )}
      </div>
    </div>
  );
}
