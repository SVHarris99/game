"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { roomRef } from "@/lib/firebase/firestore";
import type { RoomDocument } from "@/types/game";

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<RoomDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      roomRef(roomCode),
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom(snapshot.data());
        } else {
          setRoom(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Room listener error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomCode]);

  return { room, loading, error };
}
