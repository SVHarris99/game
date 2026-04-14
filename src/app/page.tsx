"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CornerDownLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { bouncySpring, spring } from "@/lib/motion";

const floatingDoodles: Array<{
  emoji: string;
  className: string;
  rotate: number;
  delay: number;
}> = [
  {
    emoji: "🎉",
    className: "top-6 left-4 sm:top-10 sm:left-10 text-5xl sm:text-6xl",
    rotate: -12,
    delay: 0,
  },
  {
    emoji: "🎲",
    className: "top-10 right-4 sm:top-16 sm:right-12 text-5xl sm:text-6xl",
    rotate: 14,
    delay: 0.6,
  },
  {
    emoji: "🎤",
    className: "bottom-10 left-6 sm:bottom-16 sm:left-14 text-5xl sm:text-6xl",
    rotate: 8,
    delay: 1.2,
  },
  {
    emoji: "🎯",
    className:
      "bottom-6 right-6 sm:bottom-12 sm:right-16 text-5xl sm:text-6xl",
    rotate: -10,
    delay: 1.8,
  },
];

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const { createRoom, joinRoom } = useGameActions();
  const router = useRouter();

  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const code = await createRoom(user.uid, name.trim());
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !name.trim() || !roomCode.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const code = roomCode.trim().toUpperCase();
      await joinRoom(code, user.uid, name.trim());
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-bright-teal border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      {/* Floating emoji doodles */}
      {floatingDoodles.map((d) => (
        <motion.div
          key={d.emoji}
          aria-hidden
          className={`pointer-events-none select-none absolute ${d.className}`}
          style={{ rotate: d.rotate }}
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: d.delay,
          }}
        >
          {d.emoji}
        </motion.div>
      ))}

      {/* Hero sticker card */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: -2 }}
        transition={bouncySpring}
        className="relative z-10 w-full max-w-md mb-10"
      >
        <Card
          variant="sticker"
          tilt="left"
          className="sticker-shadow-lg text-center"
          style={{ backgroundColor: "var(--color-sticker-violet)" }}
        >
          <h1 className="font-display font-bold uppercase text-4xl sm:text-5xl leading-[0.95] tracking-tight text-white drop-shadow-[3px_3px_0_var(--color-ink)]">
            The Odd
            <br />
            One Out
          </h1>
          <p className="mt-4 text-white/90 font-display font-medium text-base sm:text-lg">
            a sneaky little party game
          </p>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {mode === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="flex-1 inline-flex items-center justify-center gap-2"
                onClick={() => setMode("create")}
              >
                <Play className="w-5 h-5" fill="currentColor" />
                NEW ROOM
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 inline-flex items-center justify-center gap-2"
                onClick={() => setMode("join")}
              >
                <CornerDownLeft className="w-5 h-5" />
                JOIN ROOM
              </Button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <Card variant="sticker" tilt="right" className="space-y-4">
                <h2 className="font-display font-bold text-2xl text-bright-teal">
                  NEW ROOM
                </h2>
                <Input
                  label="Your nickname"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  autoFocus
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMode("idle");
                      setError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreate}
                    disabled={!name.trim() || submitting}
                  >
                    {submitting ? "Creating..." : "Create"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <Card variant="sticker" tilt="right" className="space-y-4">
                <h2 className="font-display font-bold text-2xl text-bright-teal">
                  JOIN ROOM
                </h2>
                <Input
                  label="Your nickname"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  autoFocus
                />
                <div className="flex gap-2 items-end">
                  <Input
                    label="Room code"
                    placeholder="ABCD"
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(e.target.value.toUpperCase().slice(0, 4))
                    }
                    maxLength={4}
                    className="text-center text-2xl tracking-[0.3em] uppercase font-display"
                  />
                  <Button
                    onClick={handleJoin}
                    disabled={
                      !name.trim() || roomCode.length !== 4 || submitting
                    }
                    className="shrink-0 inline-flex items-center gap-1"
                    aria-label="Go"
                  >
                    {submitting ? "..." : (
                      <>
                        GO <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                {error && <p className="text-danger text-sm">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMode("idle");
                      setError("");
                    }}
                  >
                    Back
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
