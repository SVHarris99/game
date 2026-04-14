"use client";

import { useSearchParams } from "next/navigation";

export function useDebug() {
  const params = useSearchParams();
  return params.get("debug") === "1";
}

export function isBot(playerId: string) {
  return playerId.startsWith("bot-");
}
