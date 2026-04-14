"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, LogOut, Trash2 } from "lucide-react";
import { useRoomContext } from "@/providers/RoomProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useGameActions } from "@/hooks/useGameActions";
import { cn } from "@/lib/utils";

export function RoomControlsMenu({ className }: { className?: string }) {
  const router = useRouter();
  const { room, isHost } = useRoomContext();
  const { user } = useAuth();
  const { leaveRoom, endRoom } = useGameActions();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  // Click-outside + escape close
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Guard: only mount if we actually have a room + auth user.
  if (!room || !user) return null;

  const handleLeave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await leaveRoom(room.code, user.uid);
      close();
      router.push("/");
    } catch (err) {
      console.error("Leave room failed:", err);
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    if (busy) return;
    const ok = window.confirm(
      "End this game and remove all players? This can't be undone."
    );
    if (!ok) return;
    setBusy(true);
    try {
      await endRoom(room.code);
      close();
      router.push("/");
    } catch (err) {
      console.error("End room failed:", err);
      setBusy(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Room menu"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Room menu"
        className={cn(
          "inline-flex items-center justify-center w-9 h-9 rounded-xl",
          "sticker-border sticker-shadow-sm sticker-press",
          "bg-sticker-yellow text-ink",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bright-teal/50"
        )}
      >
        <MoreVertical className="w-5 h-5" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Room controls"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={cn(
              "absolute right-0 top-full mt-2 z-50",
              "min-w-[200px] p-2 rounded-2xl",
              "sticker-border sticker-shadow-sm",
              "bg-cream text-ink",
              "origin-top-right"
            )}
          >
            {isHost ? (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={handleEnd}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left",
                  "font-display font-bold uppercase tracking-wide text-sm",
                  "hover:bg-sticker-coral/20 active:bg-sticker-coral/30",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sticker-coral"
                )}
              >
                <Trash2 className="w-4 h-4" aria-hidden />
                End Game for Everyone
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={handleLeave}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left",
                  "font-display font-bold uppercase tracking-wide text-sm",
                  "hover:bg-sticker-yellow/40 active:bg-sticker-yellow/60",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-teal"
                )}
              >
                <LogOut className="w-4 h-4" aria-hidden />
                Leave Room
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
