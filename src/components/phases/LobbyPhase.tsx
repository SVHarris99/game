"use client";

import { motion } from "framer-motion";
import { Copy, Check, Users } from "lucide-react";
import { useState } from "react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

export function LobbyPhase() {
  const { room, players, isHost } = useRoomContext();
  const { startGame } = useGameActions();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!room) return null;

  const canStart = players.length >= 3;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="flex-1 flex flex-col items-center">
      {/* Room code display */}
      <Card variant="elevated" className="w-full max-w-sm text-center mb-6">
        <p className="text-sm text-white/40 mb-2">Share this code</p>
        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center gap-3 mx-auto group"
        >
          <span className="text-5xl font-bold tracking-[0.4em] text-bright-teal font-mono">
            {room.code}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-bright-teal" />
          ) : (
            <Copy className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
          )}
        </button>
      </Card>

      {/* Player list */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/40">
            Players ({players.length})
          </span>
          {!canStart && (
            <span className="text-xs text-white/20 ml-auto">
              Need {3 - players.length} more
            </span>
          )}
        </div>
        <div className="space-y-2">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-mid/50"
            >
              <PlayerAvatar
                name={player.name}
                color={player.avatarColor}
                size="sm"
              />
              <span className="font-medium">{player.name}</span>
              {player.isHost && (
                <span className="text-xs text-bright-teal bg-bright-teal/10 px-2 py-0.5 rounded-full ml-auto">
                  Host
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Waiting message or start button */}
      <div className="w-full max-w-sm mt-auto">
        {isHost ? (
          <Button
            size="lg"
            className="w-full"
            onClick={handleStart}
            disabled={!canStart || starting}
          >
            {starting
              ? "Starting..."
              : canStart
                ? "Start Game"
                : `Need ${3 - players.length} more player${3 - players.length > 1 ? "s" : ""}`}
          </Button>
        ) : (
          <p className="text-center text-white/40">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}
