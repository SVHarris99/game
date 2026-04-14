"use client";

import { useCallback } from "react";
import {
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import {
  roomRef,
  playerRef,
  secretRef,
  playersCollection,
  secretsCollection,
} from "@/lib/firebase/firestore";
import { generateRoomCode } from "@/lib/utils";
import { selectWord } from "@/lib/game/words";
import { assignRoles } from "@/lib/game/roles";
import { calculateRoundScores } from "@/lib/game/scoring";
import { AVATAR_COLORS } from "@/types/game";
import type { RoomDocument, PlayerDocument, RoundResult } from "@/types/game";

export function useGameActions() {
  const createRoom = useCallback(
    async (playerId: string, playerName: string): Promise<string> => {
      let code = generateRoomCode();
      let attempts = 0;

      // Retry if code already exists
      while (attempts < 5) {
        const existing = await getDoc(roomRef(code));
        if (!existing.exists()) break;
        code = generateRoomCode();
        attempts++;
      }

      const roomData: Omit<RoomDocument, "createdAt" | "phaseStartedAt"> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        phaseStartedAt: ReturnType<typeof serverTimestamp>;
      } = {
        code,
        hostId: playerId,
        createdAt: serverTimestamp() as never,
        phase: "lobby",
        phaseStartedAt: serverTimestamp() as never,
        currentCategory: "",
        currentWord: "",
        turnOrder: [],
        currentTurnIndex: 0,
        clues: {},
        votes: {},
        votingComplete: false,
        scores: {},
        imposterId: "",
        roundNumber: 0,
        roundHistory: [],
        status: "waiting",
      };

      await setDoc(roomRef(code), roomData);

      // Add host as first player
      await setDoc(playerRef(code, playerId), {
        id: playerId,
        name: playerName,
        joinedAt: serverTimestamp(),
        isHost: true,
        isConnected: true,
        avatarColor: AVATAR_COLORS[0],
      } as unknown as PlayerDocument);

      return code;
    },
    []
  );

  const joinRoom = useCallback(
    async (
      roomCode: string,
      playerId: string,
      playerName: string
    ): Promise<void> => {
      const roomSnap = await getDoc(roomRef(roomCode));
      if (!roomSnap.exists()) throw new Error("Room not found");

      const room = roomSnap.data();
      if (room.phase !== "lobby") throw new Error("Game already in progress");

      // Check if player already in room
      const playerSnap = await getDoc(playerRef(roomCode, playerId));
      if (playerSnap.exists()) return; // Already joined

      // Get current player count for avatar color
      const playersSnap = await getDocs(playersCollection(roomCode));
      const colorIndex = playersSnap.size % AVATAR_COLORS.length;

      await setDoc(playerRef(roomCode, playerId), {
        id: playerId,
        name: playerName,
        joinedAt: serverTimestamp(),
        isHost: false,
        isConnected: true,
        avatarColor: AVATAR_COLORS[colorIndex],
      } as unknown as PlayerDocument);
    },
    []
  );

  const startGame = useCallback(
    async (roomCode: string, players: PlayerDocument[]): Promise<void> => {
      if (players.length < 3) throw new Error("Need at least 3 players");

      // Get previously used words
      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      const usedWords = room?.roundHistory.map((r) => r.word) ?? [];

      // Select word and assign roles
      const { category, word } = selectWord(usedWords);
      const { imposterId, secrets } = assignRoles(players, category, word);

      // Write secrets for each player
      const batch = writeBatch(getFirestoreDb());
      for (const [pid, secretData] of secrets) {
        batch.set(secretRef(roomCode, pid), secretData);
      }

      // Sort players alphabetically for turn order
      const turnOrder = [...players]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => p.id);

      // Initialize scores if first round
      const scores: Record<string, number> = room?.scores ?? {};
      for (const p of players) {
        if (!(p.id in scores)) scores[p.id] = 0;
      }

      // Update room state
      batch.update(roomRef(roomCode), {
        phase: "roleReveal",
        phaseStartedAt: serverTimestamp(),
        currentCategory: category,
        currentWord: "", // Hidden until results
        turnOrder,
        currentTurnIndex: 0,
        clues: {},
        votes: {},
        votingComplete: false,
        scores,
        imposterId: "", // Hidden until results
        roundNumber: (room?.roundNumber ?? 0) + 1,
        status: "active",
      });

      await batch.commit();

      // Store imposter ID and word in a temp way the host can reference
      // We'll write these to the room doc only at results phase
      // For now, store in sessionStorage so host can reveal later
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `game-${roomCode}-secret`,
          JSON.stringify({ imposterId, word })
        );
      }
    },
    []
  );

  const advanceToClue = useCallback(async (roomCode: string) => {
    await updateDoc(roomRef(roomCode), {
      phase: "clue",
      phaseStartedAt: serverTimestamp(),
    });
  }, []);

  const submitClue = useCallback(
    async (roomCode: string, playerId: string, clue: string) => {
      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");

      const newClues = { ...room.clues, [playerId]: clue };
      const nextTurnIndex = room.currentTurnIndex + 1;
      const allDone = nextTurnIndex >= room.turnOrder.length;

      await updateDoc(roomRef(roomCode), {
        clues: newClues,
        currentTurnIndex: nextTurnIndex,
        ...(allDone
          ? {
              phase: "discussion",
              phaseStartedAt: serverTimestamp(),
            }
          : {
              phaseStartedAt: serverTimestamp(),
            }),
      });
    },
    []
  );

  const advanceToVoting = useCallback(async (roomCode: string) => {
    await updateDoc(roomRef(roomCode), {
      phase: "voting",
      phaseStartedAt: serverTimestamp(),
    });
  }, []);

  const submitVote = useCallback(
    async (roomCode: string, voterId: string, targetId: string) => {
      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");

      if (voterId in room.votes) throw new Error("Already voted");
      if (voterId === targetId) throw new Error("Cannot vote for yourself");

      const newVotes = { ...room.votes, [voterId]: targetId };
      await updateDoc(roomRef(roomCode), { votes: newVotes });
    },
    []
  );

  const revealResults = useCallback(
    async (roomCode: string, playerIds: string[]) => {
      // Retrieve host's stored secret
      const storedSecret =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`game-${roomCode}-secret`)
          : null;

      if (!storedSecret) throw new Error("Game secret not found");

      const { imposterId, word } = JSON.parse(storedSecret) as {
        imposterId: string;
        word: string;
      };

      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");

      const { deltas, imposterCaught } = calculateRoundScores(
        room.votes,
        imposterId,
        playerIds
      );

      // Update cumulative scores
      const newScores = { ...room.scores };
      for (const [pid, delta] of Object.entries(deltas)) {
        newScores[pid] = (newScores[pid] || 0) + delta;
      }

      const roundResult: RoundResult = {
        round: room.roundNumber,
        category: room.currentCategory,
        word,
        imposterId,
        votes: room.votes,
        imposterCaught,
        scoreDeltas: deltas,
      };

      await updateDoc(roomRef(roomCode), {
        phase: "results",
        phaseStartedAt: serverTimestamp(),
        currentWord: word,
        imposterId,
        votingComplete: true,
        scores: newScores,
        roundHistory: [...room.roundHistory, roundResult],
      });
    },
    []
  );

  const playAgain = useCallback(
    async (roomCode: string, players: PlayerDocument[]) => {
      // Clear old secrets
      const secretsDocs = await getDocs(secretsCollection(roomCode));
      const batch = writeBatch(getFirestoreDb());
      for (const d of secretsDocs.docs) {
        batch.delete(d.ref);
      }
      await batch.commit();

      // Start new round (reuses startGame)
      await startGame(roomCode, players);
    },
    [startGame]
  );

  const backToLobby = useCallback(async (roomCode: string) => {
    // Clear secrets
    const secretsDocs = await getDocs(secretsCollection(roomCode));
    const batch = writeBatch(getFirestoreDb());
    for (const d of secretsDocs.docs) {
      batch.delete(d.ref);
    }

    batch.update(roomRef(roomCode), {
      phase: "lobby",
      phaseStartedAt: serverTimestamp(),
      currentCategory: "",
      currentWord: "",
      turnOrder: [],
      currentTurnIndex: 0,
      clues: {},
      votes: {},
      votingComplete: false,
      imposterId: "",
      roundNumber: 0,
      roundHistory: [],
      scores: {},
      status: "waiting",
    });

    await batch.commit();
  }, []);

  return {
    createRoom,
    joinRoom,
    startGame,
    advanceToClue,
    submitClue,
    advanceToVoting,
    submitVote,
    revealResults,
    playAgain,
    backToLobby,
  };
}
