"use client";

import { useEffect, useRef } from "react";
import { useRoomContext } from "@/providers/RoomProvider";
import { AnimatePresence, motion } from "framer-motion";
import { LobbyPhase } from "@/components/phases/LobbyPhase";
import { RoleRevealPhase } from "@/components/phases/RoleRevealPhase";
import { CluePhase } from "@/components/phases/CluePhase";
import { DiscussionPhase } from "@/components/phases/DiscussionPhase";
import { VotingPhase } from "@/components/phases/VotingPhase";
import { ResultsPhase } from "@/components/phases/ResultsPhase";
import { useSfx } from "@/lib/sfx/useSfx";

export function PhaseRouter() {
  const { room } = useRoomContext();
  const { play } = useSfx();
  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!room) return;
    const prev = prevPhaseRef.current;
    if (prev !== null && prev !== room.phase) {
      play("phase");
    }
    prevPhaseRef.current = room.phase;
  }, [room, play]);

  if (!room) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={room.phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        {room.phase === "lobby" && <LobbyPhase />}
        {room.phase === "roleReveal" && <RoleRevealPhase />}
        {room.phase === "clue" && <CluePhase />}
        {room.phase === "discussion" && <DiscussionPhase />}
        {room.phase === "voting" && <VotingPhase />}
        {room.phase === "results" && <ResultsPhase />}
      </motion.div>
    </AnimatePresence>
  );
}
