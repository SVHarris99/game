"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useRoom } from "@/hooks/useRoom";
import { usePlayers } from "@/hooks/usePlayers";
import { useMySecret } from "@/hooks/useMySecret";
import { useAuth } from "@/providers/AuthProvider";
import type { RoomDocument, PlayerDocument, SecretDocument } from "@/types/game";

interface RoomContextValue {
  room: RoomDocument | null;
  players: PlayerDocument[];
  mySecret: SecretDocument | null;
  myPlayer: PlayerDocument | null;
  isHost: boolean;
  loading: boolean;
}

const RoomContext = createContext<RoomContextValue>({
  room: null,
  players: [],
  mySecret: null,
  myPlayer: null,
  isHost: false,
  loading: true,
});

interface RoomProviderProps {
  roomCode: string;
  children: ReactNode;
}

export function RoomProvider({ roomCode, children }: RoomProviderProps) {
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(roomCode);
  const { players, loading: playersLoading } = usePlayers(roomCode);
  const { secret } = useMySecret(roomCode, user?.uid ?? null);

  const myPlayer = players.find((p) => p.id === user?.uid) ?? null;
  const isHost = room?.hostId === user?.uid;
  const loading = roomLoading || playersLoading;

  return (
    <RoomContext.Provider
      value={{
        room,
        players,
        mySecret: secret,
        myPlayer,
        isHost,
        loading,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomContext must be used within RoomProvider");
  }
  return context;
}
