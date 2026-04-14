# Three-Round Game Design

**Status:** Spec — awaiting implementation plan
**Date:** 2026-04-13
**Repo:** `/Users/brennenharris/workspace/Game` (Next.js 16 + Firebase)

---

## Context

The game currently plays one round. If the imposter escapes the first vote, the match simply ends with "imposter escaped" — there's no second chance. We want to extend it to up to **three rounds** per match (sudden-death: ends when imposter is caught) with **different mechanics each round** so the game stays fresh and rewards continued observation. Inspired by Jackbox's *Push The Button* pattern of varying tests between accusations.

This spec also folds in:
- A slim stale-room cleanup (host "End Game", player "Leave Room" buttons)
- A pending bug-fix already committed locally (`9cf0be6`) — SFX 416 suppression + Results-screen error surfacing

---

## End Conditions & Scoring

- **Imposter caught in any round** → insiders win. Game ends immediately with results screen.
- **Imposter survives all 3 rounds** → imposter wins. Game ends.
- **Scoring** (accumulated across rounds):
  - Each round the imposter is caught: insiders split points (existing `calculateRoundScores` logic).
  - Each round the imposter escapes: imposter earns "escape" points.
  - Final scoreboard on the end screen sums across all rounds played.
  - Per-round `RoundResult` entries already exist in `room.roundHistory`; this keeps working.

The same imposter and same secret word carry through all three rounds.

---

## Round 1 — Classic (unchanged)

- One-word clue per player, turn-based, 30s timer, discussion phase, vote phase.
- No changes to mechanics.
- On results:
  - If imposter caught → end screen ("INSIDERS WIN — Round 1").
  - If imposter escaped → "ROUND 1 ESCAPE" interstitial → auto-advance to Round 2. (Host client drives the advance after a 2s display, via `advanceToRound2` which writes the new phase + resets `clues`, `votes`, `currentTurnIndex`, and reverses `turnOrder`.)

---

## Round 2 — "Fresh Angles" (no-repeat + reversed turn order)

**Only plays if imposter escaped Round 1.**

**Mechanics:**
- Turn order is the **reverse** of Round 1's turn order.
- Each player must give a **new one-word clue** — their own R1 clue is blocked client-side with an inline message ("Can't reuse your Round 1 clue"). Validation is client-side only (a motivated cheater could bypass, but not worth server-side enforcement for a party game).
- Clue → discussion → vote, same timing as R1.
- On results:
  - Imposter caught → end screen ("INSIDERS WIN — Round 2").
  - Escaped → "ROUND 2 ESCAPE" interstitial → advance to Round 3.

**Data:** the R1 `roundHistory[0].clues` is used to look up each player's prior clue for the no-repeat check.

---

## Round 3 — "Point at the Person" (physical in-person mechanic)

**Only plays if imposter escaped Round 2.** Assumes all players are physically together in one room.

### Flow

1. **Prompt Phase** — 3 prompts, back-to-back, each following this pattern:
   - All players see a 3-2-1-POINT! countdown on their phones (synced via `phaseStartedAt`).
   - **Insider screens show:** _"Point at the **fastest** person in the room"_
   - **Imposter screen shows:** _"Point at the **slowest** person in the room"_ (opposite polarity of the same trait)
   - After the countdown hits zero, each player taps the player they're pointing at (their own phone's player grid).
   - Pointings lock when all players have tapped OR after a 15s timer. Non-submitters are recorded as "no pick" (null); game continues with partial data.
   - A "reveal" overlay shows "prompt N of 3 complete" with a brief summary of who pointed at whom. Then the next prompt starts.
2. **Final Vote Phase** — after all 3 prompts, a single vote screen. Accumulated pointing data is visible as a recap above the ballot.
3. **Results** — end screen either way. Caught → "INSIDERS WIN — Caught Round 3". Escaped → "IMPOSTER WINS — Three-Round Escape".

### Prompt content

Ship ~20 prompt pairs in `src/lib/words/prompts.json`:

```json
{
  "pairs": [
    { "insider": "Point at the fastest person in the room", "imposter": "Point at the slowest person in the room" },
    { "insider": "Point at the tallest person in the room", "imposter": "Point at the shortest person in the room" },
    { "insider": "Point at who's most likely to cry at a movie", "imposter": "Point at who's the most stoic" },
    { "insider": "Point at the best dancer", "imposter": "Point at the worst dancer" },
    { "insider": "Point at the early bird", "imposter": "Point at the night owl" },
    { "insider": "Point at who'd survive a zombie apocalypse", "imposter": "Point at who gets caught first" },
    { "insider": "Point at the loudest person", "imposter": "Point at the quietest person" },
    { "insider": "Point at the biggest foodie", "imposter": "Point at the pickiest eater" },
    { "insider": "Point at the most organized person", "imposter": "Point at the most chaotic person" },
    { "insider": "Point at the most competitive person", "imposter": "Point at the most chill person" },
    { "insider": "Point at who'd start a business", "imposter": "Point at who's the most risk-averse" },
    { "insider": "Point at who gets the joke first", "imposter": "Point at who gets the joke last" },
    { "insider": "Point at the best singer", "imposter": "Point at the worst singer" },
    { "insider": "Point at the biggest gossip", "imposter": "Point at the best secret keeper" },
    { "insider": "Point at who texts back instantly", "imposter": "Point at who ghosts for a week" },
    { "insider": "Point at the road-tripper", "imposter": "Point at who always flies" },
    { "insider": "Point at the loudest laugh", "imposter": "Point at the quiet smile" },
    { "insider": "Point at who's first on the dance floor", "imposter": "Point at who's last off it" },
    { "insider": "Point at who's most likely to break something", "imposter": "Point at the most careful" },
    { "insider": "Point at who'd adopt a stray animal", "imposter": "Point at the most practical" }
  ]
}
```

3 pairs are randomly selected per Round 3, without repeats within a match.

### Prompt-to-player mapping

- Host selects 3 prompts (random, no repeats) when advancing to Round 3 and writes them into the room doc.
- Each player's screen reads from `room.round3Prompts[promptIndex]`, picking the `insider` or `imposter` field based on their role (from their existing `/secrets/{playerId}` document).

### Pointing data storage

Added to `RoomDocument`:
```ts
round3Prompts: Array<{ insider: string; imposter: string }>; // 3 prompts, set at phase entry
round3Pointings: Record<number /* promptIndex */, Record<string /* voterId */, string /* targetId */>>;
round3CurrentPromptIndex: number; // 0..2
```

---

## Phase Machine Changes

New phases added to `GamePhase`:
- `roundIntermission` — short interstitial between rounds (2s auto-advance, reveals "imposter escaped — round N begins" with bouncy sticker animation)
- `round3Prompt` — the point-at-the-person prompt + countdown + selection screen
- `round3Reveal` — brief 3s recap screen showing all pointings for the just-completed prompt

Existing phases extended:
- `results` — now distinguishes "round results" (more rounds to come) from "final results" (game over). New room field `room.isFinalResults: boolean` controls this.
- `clue`, `voting` — used for both R1 and R2. Turn-order reversal and no-repeat check key off `room.roundNumber`.

```
lobby → roleReveal → clue → discussion → voting → results
                                                     ↓
                             (caught) ←─ final ─→ (escaped)
                              end                   ↓
                                          roundIntermission
                                                     ↓
                                        (R2: clue → ... → results)
                                                     ↓
                                          roundIntermission
                                                     ↓
                                        (R3: round3Prompt ×3 → voting → results)
```

---

## Stale-Room Cleanup (slim version)

No TTL, no server function. Just two UI buttons + a Firestore delete.

### Host "End Game" button
- Visible: in the Results screen (final) AND a subtle "End room" in the GameShell top-right dropdown during any phase.
- Action: deletes all `/rooms/{code}/secrets/*`, all `/rooms/{code}/players/*`, then the `/rooms/{code}` doc itself. Client redirects to `/`.

### Player "Leave Room" button
- Visible: always in the GameShell top-right dropdown for non-hosts during any phase.
- Action: deletes `/rooms/{code}/players/{myId}` and their secret (if any). Redirects to `/`.
- If the leaving player was the host → warn: "You're the host. Leaving ends the room for everyone." Confirm → proceed as host End-Game.
- If the leaving player's departure drops player count below 3 during active play → room auto-advances to results with current state (best-effort; not a full rollback).

### Firestore rules additions
- `match /rooms/{code}`: `allow delete: if isHost(code);`
- `match /rooms/{code}/players/{playerId}`: update existing rule — `allow delete: if isAuth() && (playerId == request.auth.uid || isHost(code));`
- `match /rooms/{code}/secrets/{playerId}`: already allows host delete.

---

## Firestore Schema Changes

`RoomDocument` gains:
```ts
isFinalResults: boolean;            // true when game is over; false for intermediate round results
round3Prompts: Array<{ insider: string; imposter: string }>; // empty until R3 starts
round3Pointings: Record<number, Record<string, string>>;     // empty until R3 starts
round3CurrentPromptIndex: number;   // 0 during R1/R2, 0..2 during R3
```

`SecretDocument`, `PlayerDocument`, `RoundResult` — unchanged.

---

## Firestore Rules Updates

```
match /rooms/{code} {
  ...
  allow delete: if isHost(code);   // NEW
}

match /rooms/{code}/players/{playerId} {
  ...
  allow delete: if isAuth() && (playerId == request.auth.uid || isHost(code));  // EXPANDED
}
```

---

## UI Surfaces Touched

**New files:**
- `src/components/phases/RoundIntermissionPhase.tsx` — interstitial between rounds
- `src/components/phases/Round3PromptPhase.tsx` — countdown + prompt + pick-player grid
- `src/components/phases/Round3RevealPhase.tsx` — brief recap between prompts
- `src/lib/words/prompts.json` — the 20 prompt pairs
- `src/hooks/useRound3Prompts.ts` — hook to pick the player's prompt text by role
- `src/components/ui/RoomControlsMenu.tsx` — GameShell top-right menu with Leave / End-Game

**Modified:**
- `src/types/game.ts` — add new phase names, extend `RoomDocument`, prompt pair type
- `src/hooks/useGameActions.ts` — add `advanceToRound2`, `advanceToRound3`, `submitPointing`, `leaveRoom`, `endRoom`; reverse turn order on R2; reject repeat R1 clues client-side in `submitClue` (keep server logic untouched)
- `src/components/game/PhaseRouter.tsx` — route new phases
- `src/components/phases/ResultsPhase.tsx` — branch on `isFinalResults`: either show final end screen, or show "round N results" with auto-advance to next round
- `src/components/phases/CluePhase.tsx` — read `room.roundNumber === 2` to show "no-repeat" badge + validate against `room.roundHistory[0].clues`
- `src/components/layout/GameShell.tsx` — mount `RoomControlsMenu`
- `firestore.rules` — delete permissions
- `src/lib/game/state-machine.ts` — if it encodes transitions, update

**Debug mode (existing):** bots auto-pick a random candidate during Round 3 pointing prompts, same delay pattern as their auto-vote.

---

## Verification

1. `npx next build` zero errors
2. `npm run test:words` still passes
3. Manual playthrough with `?debug=1`:
   - Create room + 2 bots → start
   - Vote wrongly in R1 → intermission → R2 auto-starts
   - Vote wrongly in R2 → intermission → R3 starts
   - Point through 3 prompts → final vote
   - Confirm imposter screen shows the opposite-polarity prompt (test as imposter role)
   - Confirm caught-any-round path ends the game immediately
4. Manual Leave Room / End Game: click both, confirm Firestore docs are deleted

---

## Risks

- **No-repeat clue check is client-only.** A malicious player could bypass. Acceptable for a party game; add server-side if abuse surfaces.
- **Round 3 pointing phase assumes all players synchronize on a phone countdown.** If one player's phone is behind/ahead, the "on 3" moment desyncs by ~1s. Using `phaseStartedAt` (serverTimestamp) as the anchor mitigates this.
- **Imposter's opposite-polarity prompt**: if the two traits converge (e.g., only 3 players and the "fastest" and "slowest" are the same person some nights — rare but possible), imposter gets free cover. Feature, not bug.
- **Stale rooms**: no TTL means abandoned rooms persist in Firestore. Acceptable for a hobby project; monitor cost.
