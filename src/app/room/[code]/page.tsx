"use client";

import { useRoomContext } from "@/providers/RoomProvider";
import { PhaseRouter } from "@/components/game/PhaseRouter";
import { GameShell } from "@/components/layout/GameShell";
import { motion } from "framer-motion";

export default function RoomPage() {
  const { room, loading } = useRoomContext();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-bright-teal border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
          <p className="text-white/50">
            This room doesn&apos;t exist or has expired.
          </p>
          <a
            href="/"
            className="text-bright-teal underline mt-4 inline-block"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <GameShell>
      <PhaseRouter />
    </GameShell>
  );
}
