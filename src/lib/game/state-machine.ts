import type { GamePhase, RoomDocument } from "@/types/game";

type Trigger =
  | "startGame"
  | "revealComplete"
  | "clueSubmitted"
  | "allCluesIn"
  | "discussionOver"
  | "allVotesIn"
  | "playAgain"
  | "backToLobby";

const transitions: Record<GamePhase, Partial<Record<Trigger, GamePhase>>> = {
  lobby: {
    startGame: "roleReveal",
  },
  roleReveal: {
    revealComplete: "clue",
  },
  clue: {
    allCluesIn: "discussion",
  },
  discussion: {
    discussionOver: "voting",
  },
  voting: {
    allVotesIn: "results",
  },
  results: {
    playAgain: "roleReveal",
    backToLobby: "lobby",
  },
  roundIntermission: {},
  round3Prompt: {},
  round3Reveal: {},
};

export function getNextPhase(
  currentPhase: GamePhase,
  trigger: Trigger
): GamePhase | null {
  return transitions[currentPhase]?.[trigger] ?? null;
}

export function canStartGame(room: RoomDocument, playerCount: number): boolean {
  return room.phase === "lobby" && playerCount >= 3;
}

export function canSubmitClue(
  room: RoomDocument,
  playerId: string
): boolean {
  return (
    room.phase === "clue" &&
    room.turnOrder[room.currentTurnIndex] === playerId &&
    !(playerId in room.clues)
  );
}

export function canVote(
  room: RoomDocument,
  playerId: string
): boolean {
  return (
    room.phase === "voting" &&
    !room.votingComplete &&
    !(playerId in room.votes)
  );
}

export function allCluesSubmitted(room: RoomDocument): boolean {
  return (
    room.phase === "clue" &&
    room.turnOrder.every((pid) => pid in room.clues)
  );
}

export function allVotesSubmitted(
  room: RoomDocument,
  playerCount: number
): boolean {
  return (
    room.phase === "voting" &&
    Object.keys(room.votes).length >= playerCount
  );
}
