"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";

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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-bold mb-2">
          <span className="text-bright-teal">The Odd</span>{" "}
          <span className="text-white">One Out</span>
        </h1>
        <p className="text-white/50 text-lg">Find the imposter among you</p>
      </motion.div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {mode === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4"
            >
              <Button size="lg" className="w-full" onClick={() => setMode("create")}>
                <Sparkles className="w-5 h-5 mr-2 inline" />
                Create Game
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setMode("join")}
              >
                <Users className="w-5 h-5 mr-2 inline" />
                Join Game
              </Button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="elevated" className="space-y-4">
                <h2 className="text-xl font-bold text-bright-teal">
                  Create Game
                </h2>
                <Input
                  label="Your Nickname"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  autoFocus
                />
                {error && (
                  <p className="text-danger text-sm">{error}</p>
                )}
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
                    {submitting ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="elevated" className="space-y-4">
                <h2 className="text-xl font-bold text-bright-teal">
                  Join Game
                </h2>
                <Input
                  label="Your Nickname"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                  autoFocus
                />
                <Input
                  label="Room Code"
                  placeholder="ABCD"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.toUpperCase().slice(0, 4))
                  }
                  maxLength={4}
                  className="text-center text-2xl tracking-[0.3em] uppercase"
                />
                {error && (
                  <p className="text-danger text-sm">{error}</p>
                )}
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
                    onClick={handleJoin}
                    disabled={
                      !name.trim() || roomCode.length !== 4 || submitting
                    }
                  >
                    {submitting ? "Joining..." : "Join Room"}
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
