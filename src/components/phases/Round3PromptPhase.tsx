"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { useDebug, isBot } from "@/hooks/useDebug";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { bouncySpring, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Phase timing (seconds)
const COUNTDOWN_SECONDS = 4; // "3… 2… 1… POINT!"
const SELECTION_SECONDS = 15;
const TOTAL_SECONDS = COUNTDOWN_SECONDS + SELECTION_SECONDS;

const STICKER_BGS = [
  "var(--color-sticker-pink)",
  "var(--color-sticker-blue)",
  "var(--color-sticker-yellow)",
  "var(--color-sticker-lime)",
  "var(--color-sticker-orange)",
  "var(--color-sticker-violet)",
];

// Reads the current second-offset since `phaseStartedAt` on a 200ms tick.
function usePhaseElapsedSeconds(phaseStartedAtMs: number | null) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  if (phaseStartedAtMs == null) return 0;
  return Math.max(0, (now - phaseStartedAtMs) / 1000);
}

export function Round3PromptPhase() {
  const { room, players, mySecret, isHost } = useRoomContext();
  const { user } = useAuth();
  const { submitPointing, advanceR3Prompt } = useGameActions();
  const debug = useDebug();
  const prefersReducedMotion = useReducedMotion();

  const [submitting, setSubmitting] = useState(false);
  const autoTimedOutRef = useRef(false);
  const hostAdvancedRef = useRef(false);

  const phaseStartedAtMs = useMemo(() => {
    const ts = room?.phaseStartedAt;
    // Firestore Timestamp has toMillis(); serverTimestamp() is null briefly.
    if (ts && typeof (ts as unknown as { toMillis?: () => number }).toMillis === "function") {
      return (ts as unknown as { toMillis: () => number }).toMillis();
    }
    return null;
  }, [room?.phaseStartedAt]);

  const elapsed = usePhaseElapsedSeconds(phaseStartedAtMs);

  const currentPromptIndex = room?.round3CurrentPromptIndex ?? 0;
  const currentPrompt = room?.round3Prompts?.[currentPromptIndex];
  const pointingsForPrompt = room?.round3Pointings?.[currentPromptIndex] ?? {};

  // Reset per-prompt refs whenever the prompt index or phase start changes.
  useEffect(() => {
    autoTimedOutRef.current = false;
    hostAdvancedRef.current = false;
  }, [currentPromptIndex, phaseStartedAtMs]);

  const myPointing = user ? pointingsForPrompt[user.uid] : undefined;
  const hasSubmitted = myPointing !== undefined;

  // Countdown display value: 3, 2, 1, POINT!
  const inCountdown = elapsed < COUNTDOWN_SECONDS;
  const countdownRemaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);
  // Show 3 then 2 then 1 then POINT! — use ceil of (countdown - 1) so 3s → 3, 2s → 2, 1s → 1, 0s → POINT.
  const countdownNumber = Math.max(1, Math.ceil(countdownRemaining - 1));
  const showPoint = countdownRemaining <= 1 && countdownRemaining > 0;
  const countdownLabel = showPoint ? "POINT!" : String(countdownNumber);

  // Selection window time remaining
  const selectionSecondsLeft = Math.max(
    0,
    Math.ceil(TOTAL_SECONDS - elapsed)
  );
  const windowExpired = elapsed >= TOTAL_SECONDS;

  // Auto-submit "no pick" on timeout for current player.
  useEffect(() => {
    if (!room || !user) return;
    if (inCountdown) return;
    if (!windowExpired) return;
    if (hasSubmitted) return;
    if (autoTimedOutRef.current) return;
    autoTimedOutRef.current = true;
    // Fire-and-forget; idempotent overwrite if somehow already submitted.
    submitPointing(room.code, user.uid, currentPromptIndex, null).catch(
      () => {}
    );
  }, [
    room,
    user,
    inCountdown,
    windowExpired,
    hasSubmitted,
    submitPointing,
    currentPromptIndex,
  ]);

  // Host auto-advance: when all players submitted OR window expired.
  useEffect(() => {
    if (!isHost || !room) return;
    if (inCountdown) return;
    if (hostAdvancedRef.current) return;

    const submittedCount = Object.keys(pointingsForPrompt).length;
    const totalPlayers = players.length;
    const allIn = submittedCount >= totalPlayers && totalPlayers > 0;

    if (!allIn && !windowExpired) return;
    // Small grace delay so any last-second writes land before advancing.
    hostAdvancedRef.current = true;
    const timer = setTimeout(() => {
      advanceR3Prompt(room.code).catch((err) => {
        console.error("advanceR3Prompt failed", err);
        hostAdvancedRef.current = false;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [
    isHost,
    room,
    players.length,
    pointingsForPrompt,
    inCountdown,
    windowExpired,
    advanceR3Prompt,
  ]);

  // Bots: host auto-submits random pointings for bot players during debug.
  useEffect(() => {
    if (!debug || !isHost || !room) return;
    if (inCountdown) return;
    if (windowExpired) return;

    const pendingBots = players.filter(
      (p) => isBot(p.id) && !(p.id in pointingsForPrompt)
    );
    if (pendingBots.length === 0) return;

    const timer = setTimeout(() => {
      for (const bot of pendingBots) {
        const candidates = players.filter((p) => p.id !== bot.id);
        if (candidates.length === 0) continue;
        const target =
          candidates[Math.floor(Math.random() * candidates.length)];
        submitPointing(room.code, bot.id, currentPromptIndex, target.id).catch(
          () => {}
        );
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    debug,
    isHost,
    room,
    players,
    pointingsForPrompt,
    inCountdown,
    windowExpired,
    submitPointing,
    currentPromptIndex,
  ]);

  if (!room || !user) return null;

  // Secret still loading: show a soft skeleton. Bots/non-authed won't hit this
  // path because bots aren't logged in users, but be defensive.
  if (!mySecret) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="font-display font-semibold text-white/60 uppercase tracking-wider text-sm"
        >
          Loading prompt…
        </motion.div>
      </div>
    );
  }

  const isImposter = mySecret.role === "imposter";
  const promptText = currentPrompt
    ? isImposter
      ? currentPrompt.imposter
      : currentPrompt.insider
    : "";

  const handleTap = async (targetId: string) => {
    if (submitting || windowExpired || inCountdown) return;
    setSubmitting(true);
    try {
      await submitPointing(room.code, user.uid, currentPromptIndex, targetId);
    } catch (err) {
      console.error("submitPointing failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const candidates = players.filter((p) => p.id !== user.uid);
  const promptNumber = currentPromptIndex + 1;

  return (
    <div className="flex-1 flex flex-col items-center w-full">
      {/* Prompt-index chip */}
      <motion.div
        initial={{ scale: 0, rotate: -6 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={bouncySpring}
        className="mb-4 px-4 py-2 bg-sticker-yellow sticker-border-thick sticker-shadow-sm rounded-2xl"
        style={{ color: "var(--color-ink)" }}
      >
        <p className="font-display font-bold uppercase text-sm tracking-wide">
          Prompt {promptNumber} of 3
        </p>
      </motion.div>

      {inCountdown ? (
        <CountdownHero
          label={countdownLabel}
          isPoint={showPoint}
          reducedMotion={!!prefersReducedMotion}
        />
      ) : (
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Prompt sticker */}
          <motion.div
            initial={{ scale: 0, rotate: -4, opacity: 0 }}
            animate={{ scale: 1, rotate: 2, opacity: 1 }}
            transition={bouncySpring}
            className="mb-4 px-5 py-4 sticker-border-thick sticker-shadow-lg rounded-2xl text-center"
            style={{
              backgroundColor: "var(--color-sticker-violet)",
              color: "#fff",
            }}
          >
            <p className="font-display font-bold uppercase text-xl sm:text-2xl leading-tight tracking-tight">
              {promptText}
            </p>
          </motion.div>

          <div className="flex items-center justify-between w-full mb-3 px-1">
            <p className="font-display font-semibold text-white/60 uppercase text-xs tracking-wide">
              Tap who you&apos;re pointing at
            </p>
            <p className="font-display font-bold text-white tabular-nums text-sm">
              {selectionSecondsLeft}s
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {candidates.map((player, i) => {
              const selected = myPointing === player.id;
              const bg = STICKER_BGS[i % STICKER_BGS.length];
              const tiltClass = i % 2 === 0 ? "tilt-left" : "tilt-right";
              const disabled = windowExpired || submitting;

              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, scale: 0, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ ...bouncySpring, delay: i * 0.05 }}
                  onClick={() => handleTap(player.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-2xl sticker-border-thick sticker-shadow sticker-press",
                    !selected && tiltClass,
                    selected &&
                      "ring-4 ring-bright-teal ring-offset-2 ring-offset-transparent",
                    disabled && "opacity-80 cursor-not-allowed"
                  )}
                  style={{
                    backgroundColor: selected
                      ? "var(--color-bright-teal)"
                      : bg,
                  }}
                >
                  <PlayerAvatar
                    name={player.name}
                    color={player.avatarColor}
                    size="lg"
                  />
                  <span
                    className="font-display font-bold text-sm truncate max-w-full"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {player.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {hasSubmitted && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="mt-4 font-display font-semibold text-white/70 text-sm text-center"
            >
              Locked in — tap again to change your pick.
            </motion.p>
          )}

          {windowExpired && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 font-display font-semibold text-white/60 text-sm text-center"
            >
              Time&apos;s up — revealing…
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}

function CountdownHero({
  label,
  isPoint,
  reducedMotion,
}: {
  label: string;
  isPoint: boolean;
  reducedMotion: boolean;
}) {
  const baseScale = reducedMotion ? 1 : 1.1;
  return (
    <div className="flex-1 flex items-center justify-center w-full">
      <motion.div
        key={label}
        initial={
          reducedMotion
            ? { opacity: 0 }
            : { scale: 0.4, rotate: -12, opacity: 0 }
        }
        animate={
          reducedMotion
            ? { opacity: 1 }
            : { scale: baseScale, rotate: isPoint ? 4 : -4, opacity: 1 }
        }
        transition={reducedMotion ? { duration: 0.15 } : bouncySpring}
        className={cn(
          "px-10 py-8 sticker-border-thick sticker-shadow-lg rounded-3xl text-center",
          isPoint && "sticker-shadow-lg"
        )}
        style={{
          backgroundColor: isPoint
            ? "var(--color-bright-teal)"
            : "var(--color-sticker-pink)",
          color: "var(--color-ink)",
        }}
      >
        <p
          className={cn(
            "font-display font-bold uppercase tracking-tight",
            isPoint ? "text-6xl sm:text-7xl" : "text-8xl sm:text-9xl"
          )}
        >
          {label}
        </p>
      </motion.div>
    </div>
  );
}
