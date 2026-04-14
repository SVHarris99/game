"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, orderBy } from "firebase/firestore";
import { playersCollection } from "@/lib/firebase/firestore";
import type { PlayerDocument } from "@/types/game";

export function usePlayers(roomCode: string | null) {
  const [players, setPlayers] = useState<PlayerDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(playersCollection(roomCode), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data());
        setPlayers(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Players listener error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomCode]);

  return { players, loading };
}
