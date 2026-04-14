"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { secretRef } from "@/lib/firebase/firestore";
import type { SecretDocument } from "@/types/game";

export function useMySecret(roomCode: string | null, playerId: string | null) {
  const [secret, setSecret] = useState<SecretDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || !playerId) {
      setSecret(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      secretRef(roomCode, playerId),
      (snapshot) => {
        if (snapshot.exists()) {
          setSecret(snapshot.data());
        } else {
          setSecret(null);
        }
        setLoading(false);
      },
      (err) => {
        // Expected to fail if no secret assigned yet (lobby phase)
        setSecret(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomCode, playerId]);

  return { secret, loading };
}
