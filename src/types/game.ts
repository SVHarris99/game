import type { Timestamp } from "firebase/firestore";

export type GamePhase =
  | "lobby"
  | "roleReveal"
  | "clue"
  | "discussion"
  | "voting"
  | "results"
  | "roundIntermission"
  | "round3Prompt"
  | "round3Reveal";

export type PlayerRole = "insider" | "imposter";

export interface PromptPair {
  insider: string;
  imposter: string;
}

export interface RoundResult {
  round: number;
  category: string;
  word: string;
  imposterId: string;
  votes: Record<string, string>;
  clues: Record<string, string>;
  imposterCaught: boolean;
  scoreDeltas: Record<string, number>;
}

export interface RoomDocument {
  code: string;
  hostId: string;
  createdAt: Timestamp;
  phase: GamePhase;
  phaseStartedAt: Timestamp;
  currentCategory: string;
  currentWord: string; // Empty during active play, revealed at results
  turnOrder: string[];
  currentTurnIndex: number;
  clues: Record<string, string>;
  votes: Record<string, string>;
  votingComplete: boolean;
  scores: Record<string, number>;
  imposterId: string; // Empty until results
  roundNumber: number;
  roundHistory: RoundResult[];
  status: "waiting" | "active" | "finished";
  isFinalResults: boolean;
  round3Prompts: PromptPair[];
  round3Pointings: Record<number, Record<string, string>>;
  round3CurrentPromptIndex: number;
}

export interface PlayerDocument {
  id: string;
  name: string;
  joinedAt: Timestamp;
  isHost: boolean;
  isConnected: boolean;
  avatarColor: string;
}

export interface SecretDocument {
  playerId: string;
  role: PlayerRole;
  word: string; // Empty for imposter
  category: string;
}

// Avatar color palette for players
export const AVATAR_COLORS = [
  "#00e5a0", // teal
  "#ff4d6a", // coral
  "#ffd700", // gold
  "#7c3aed", // violet
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#a855f7", // purple
  "#14b8a6", // emerald
] as const;
