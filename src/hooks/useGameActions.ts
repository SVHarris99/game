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
import { selectPrompts } from "@/lib/game/prompts";
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
        isFinalResults: false,
        round3Prompts: [],
        round3Pointings: {},
        round3CurrentPromptIndex: 0,
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
        isFinalResults: false,
        round3Prompts: [],
        round3Pointings: {},
        round3CurrentPromptIndex: 0,
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

  const addBot = useCallback(async (roomCode: string): Promise<void> => {
    const names = [
      "Buzz", "Pixel", "Waffles", "Nacho", "Biscuit",
      "Dizzy", "Pickle", "Noodle", "Zippy", "Muffin",
      "Scooter", "Sprout", "Bubbles", "Taco", "Mochi",
    ];
    const playersSnap = await getDocs(playersCollection(roomCode));
    const existing = new Set(playersSnap.docs.map((d) => d.data().name));
    const available = names.filter((n) => !existing.has(n));
    const pool = available.length > 0 ? available : names;
    const name = pool[Math.floor(Math.random() * pool.length)];
    const id = `bot-${Math.random().toString(36).slice(2, 8)}`;
    const colorIndex = playersSnap.size % AVATAR_COLORS.length;

    await setDoc(playerRef(roomCode, id), {
      id,
      name,
      joinedAt: serverTimestamp(),
      isHost: false,
      isConnected: true,
      avatarColor: AVATAR_COLORS[colorIndex],
    } as unknown as PlayerDocument);
  }, []);

  const submitClue = useCallback(
    async (roomCode: string, playerId: string, clue: string) => {
      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");

      // R2 no-repeat gate (client-side only; a motivated cheater could bypass).
      if (room.roundNumber === 2 && room.roundHistory.length > 0) {
        const r1Clue = room.roundHistory[0]?.clues?.[playerId];
        if (
          r1Clue &&
          r1Clue.trim().toLowerCase() === clue.trim().toLowerCase()
        ) {
          throw new Error("Can't reuse your Round 1 clue");
        }
      }

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
        clues: room.clues,
        imposterCaught,
        scoreDeltas: deltas,
      };

      // Game ends when: insiders catch the imposter in any round, OR
      // the imposter survives all 3 rounds (imposter wins).
      const isFinalResults = imposterCaught || room.roundNumber >= 3;

      await updateDoc(roomRef(roomCode), {
        phase: "results",
        phaseStartedAt: serverTimestamp(),
        currentWord: word,
        imposterId,
        votingComplete: true,
        scores: newScores,
        roundHistory: [...room.roundHistory, roundResult],
        isFinalResults,
      });
    },
    []
  );

  const playAgain = useCallback(
    async (roomCode: string, players: PlayerDocument[]) => {
      if (players.length < 3) throw new Error("Need at least 3 players");

      // Read current state + existing secrets in parallel.
      const [roomSnap, secretsDocs] = await Promise.all([
        getDoc(roomRef(roomCode)),
        getDocs(secretsCollection(roomCode)),
      ]);
      const room = roomSnap.data();

      // Select a fresh word (avoiding any used so far) and assign roles.
      const usedWords = room?.roundHistory.map((r) => r.word) ?? [];
      const { category, word } = selectWord(usedWords);
      const { imposterId, secrets } = assignRoles(players, category, word);

      // Atomic: delete old secrets + write new secrets + reset room — all in
      // one batch. This avoids a race where the delete lands but the
      // subsequent `set` is interpreted as an update (which is disallowed by
      // the security rules `allow update: if false` on /secrets).
      const batch = writeBatch(getFirestoreDb());
      for (const d of secretsDocs.docs) {
        batch.delete(d.ref);
      }
      for (const [pid, secretData] of secrets) {
        batch.set(secretRef(roomCode, pid), secretData);
      }

      const turnOrder = [...players]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => p.id);

      // Fresh match → reset cumulative scores.
      const scores: Record<string, number> = {};
      for (const p of players) scores[p.id] = 0;

      batch.update(roomRef(roomCode), {
        phase: "roleReveal",
        phaseStartedAt: serverTimestamp(),
        currentCategory: category,
        currentWord: "",
        turnOrder,
        currentTurnIndex: 0,
        clues: {},
        votes: {},
        votingComplete: false,
        scores,
        imposterId: "",
        roundNumber: 1,
        roundHistory: [],
        status: "active",
        isFinalResults: false,
        round3Prompts: [],
        round3Pointings: {},
        round3CurrentPromptIndex: 0,
      });

      await batch.commit();

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `game-${roomCode}-secret`,
          JSON.stringify({ imposterId, word })
        );
      }
    },
    []
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
      isFinalResults: false,
      round3Prompts: [],
      round3Pointings: {},
      round3CurrentPromptIndex: 0,
    });

    await batch.commit();
  }, []);

  // --- Multi-round advancement ------------------------------------------
  // NOTE: the secret word + imposter ID are stashed in the host's
  // sessionStorage by `startGame`. The secret doesn't change across rounds in
  // a single match, so we do NOT re-write it on round advances — the host
  // client still has the original value to reveal at each round's results.

  const advanceToRound2 = useCallback(async (roomCode: string) => {
    const roomSnap = await getDoc(roomRef(roomCode));
    const room = roomSnap.data();
    if (!room) throw new Error("Room not found");
    if (room.phase !== "results") {
      throw new Error("Cannot advance to Round 2 from current phase");
    }
    const last = room.roundHistory[room.roundHistory.length - 1];
    if (!last || last.imposterCaught) {
      throw new Error("Round 2 only plays when imposter escaped");
    }
    if (room.roundNumber !== 1) {
      throw new Error("advanceToRound2 requires roundNumber === 1");
    }

    await updateDoc(roomRef(roomCode), {
      phase: "roundIntermission",
      phaseStartedAt: serverTimestamp(),
      turnOrder: [...room.turnOrder].reverse(),
      currentTurnIndex: 0,
      clues: {},
      votes: {},
      votingComplete: false,
      imposterId: "", // hidden again during active play
      currentWord: "", // hidden again during active play
      roundNumber: 2,
    });
  }, []);

  const advanceToRound3 = useCallback(async (roomCode: string) => {
    const roomSnap = await getDoc(roomRef(roomCode));
    const room = roomSnap.data();
    if (!room) throw new Error("Room not found");
    if (room.phase !== "results") {
      throw new Error("Cannot advance to Round 3 from current phase");
    }
    const last = room.roundHistory[room.roundHistory.length - 1];
    if (!last || last.imposterCaught) {
      throw new Error("Round 3 only plays when imposter escaped");
    }
    if (room.roundNumber !== 2) {
      throw new Error("advanceToRound3 requires roundNumber === 2");
    }

    await updateDoc(roomRef(roomCode), {
      phase: "roundIntermission",
      phaseStartedAt: serverTimestamp(),
      // turnOrder unchanged from R2
      currentTurnIndex: 0,
      clues: {},
      votes: {},
      votingComplete: false,
      imposterId: "",
      currentWord: "",
      roundNumber: 3,
      round3Prompts: selectPrompts(3),
      round3CurrentPromptIndex: 0,
      round3Pointings: {},
    });
  }, []);

  // --- Round 3 pointing --------------------------------------------------

  const submitPointing = useCallback(
    async (
      roomCode: string,
      playerId: string,
      promptIndex: number,
      targetId: string | null
    ) => {
      const roomSnap = await getDoc(roomRef(roomCode));
      const room = roomSnap.data();
      if (!room) throw new Error("Room not found");

      const existing = room.round3Pointings ?? {};
      const forPrompt = { ...(existing[promptIndex] ?? {}) };
      // Firestore doesn't allow `null` values nicely in nested maps; store as
      // empty string to represent "no pick".
      forPrompt[playerId] = targetId ?? "";

      const nextPointings = { ...existing, [promptIndex]: forPrompt };
      await updateDoc(roomRef(roomCode), {
        round3Pointings: nextPointings,
      });
    },
    []
  );

  /**
   * Host-driven: called once the current prompt's pointing window has
   * completed (all players pointed or timer expired).
   * - If more prompts remain → transition to `round3Reveal` for a brief recap.
   * - If the just-completed prompt was the last one → transition to `voting`
   *   for the final vote.
   */
  const advanceR3Prompt = useCallback(async (roomCode: string) => {
    const roomSnap = await getDoc(roomRef(roomCode));
    const room = roomSnap.data();
    if (!room) throw new Error("Room not found");

    const idx = room.round3CurrentPromptIndex ?? 0;
    if (idx >= 2) {
      // All 3 prompts done → final vote.
      await updateDoc(roomRef(roomCode), {
        phase: "voting",
        phaseStartedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(roomRef(roomCode), {
        phase: "round3Reveal",
        phaseStartedAt: serverTimestamp(),
      });
    }
  }, []);

  /**
   * Host-driven: move from `roundIntermission` into R3's first prompt.
   * Assumes round-3 setup (prompts, index reset) was already written when
   * the room advanced to `roundIntermission` via `advanceToRound3`.
   */
  const advanceToRound3Prompt = useCallback(async (roomCode: string) => {
    await updateDoc(roomRef(roomCode), {
      phase: "round3Prompt",
      phaseStartedAt: serverTimestamp(),
    });
  }, []);

  /** Host-driven: after the reveal recap, move to the next prompt. */
  const advanceAfterR3Reveal = useCallback(async (roomCode: string) => {
    const roomSnap = await getDoc(roomRef(roomCode));
    const room = roomSnap.data();
    if (!room) throw new Error("Room not found");

    const nextIdx = (room.round3CurrentPromptIndex ?? 0) + 1;
    await updateDoc(roomRef(roomCode), {
      phase: "round3Prompt",
      phaseStartedAt: serverTimestamp(),
      round3CurrentPromptIndex: nextIdx,
    });
  }, []);

  // --- Room teardown -----------------------------------------------------

  /**
   * Remove a single player (and their secret) from a room.
   * If the leaving player is the host, the UI should call `endRoom` instead;
   * this function does not detect/guard that case.
   */
  const leaveRoom = useCallback(
    async (roomCode: string, playerId: string) => {
      try {
        await deleteDoc(playerRef(roomCode, playerId));
      } catch {
        // ignore not-found
      }
      try {
        await deleteDoc(secretRef(roomCode, playerId));
      } catch {
        // secret may not exist; ignore
      }
    },
    []
  );

  /** Host-only: tear down the entire room (players, secrets, room doc). */
  const endRoom = useCallback(async (roomCode: string) => {
    const db = getFirestoreDb();

    const playersSnap = await getDocs(playersCollection(roomCode));
    const secretsSnap = await getDocs(secretsCollection(roomCode));

    const batch = writeBatch(db);
    for (const d of playersSnap.docs) batch.delete(d.ref);
    for (const d of secretsSnap.docs) batch.delete(d.ref);
    batch.delete(roomRef(roomCode));
    await batch.commit();
  }, []);

  return {
    createRoom,
    joinRoom,
    addBot,
    startGame,
    advanceToClue,
    submitClue,
    advanceToVoting,
    submitVote,
    revealResults,
    playAgain,
    backToLobby,
    advanceToRound2,
    advanceToRound3,
    submitPointing,
    advanceR3Prompt,
    advanceToRound3Prompt,
    advanceAfterR3Reveal,
    leaveRoom,
    endRoom,
  };
}
