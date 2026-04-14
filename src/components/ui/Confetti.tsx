"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { bouncySpring } from "@/lib/motion";

const STICKER_PALETTE = [
  "var(--color-sticker-pink)",
  "var(--color-sticker-blue)",
  "var(--color-sticker-yellow)",
  "var(--color-sticker-lime)",
  "var(--color-sticker-orange)",
  "var(--color-sticker-violet)",
  "var(--color-bright-teal)",
  "var(--color-gold)",
];

interface ConfettiProps {
  trigger: boolean;
  count?: number;
  durationMs?: number;
}

interface Particle {
  id: number;
  color: string;
  size: number;
  rounded: boolean;
  tx: number;
  ty: number;
  rot: number;
}

function buildParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      color: STICKER_PALETTE[i % STICKER_PALETTE.length],
      size: 8 + Math.random() * 2, // 8-10px
      rounded: Math.random() < 0.5,
      tx: (Math.random() * 2 - 1) * 400,
      // Mostly upward — bias y toward negative
      ty: Math.random() * -300 + (Math.random() < 0.3 ? 150 : -30),
      rot: (Math.random() < 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    });
  }
  return particles;
}

export function Confetti({
  trigger,
  count = 50,
  durationMs = 2500,
}: ConfettiProps) {
  const prefersReducedMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      setBurstKey((k) => k + 1);
      setActive(true);
      const t = setTimeout(() => setActive(false), durationMs + 200);
      return () => clearTimeout(t);
    }
  }, [trigger, durationMs, prefersReducedMotion]);

  if (prefersReducedMotion || !active) return null;

  const particles = buildParticles(count);
  const durationSec = durationMs / 1000;

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            x: p.tx,
            y: p.ty,
            scale: [0, 1, 1, 0],
            rotate: p.rot,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            x: bouncySpring,
            y: bouncySpring,
            rotate: { duration: durationSec, ease: "linear" },
            scale: {
              duration: durationSec,
              times: [0, 0.15, 0.75, 1],
              ease: "linear",
            },
            opacity: {
              duration: durationSec,
              times: [0, 0.1, 0.75, 1],
              ease: "linear",
            },
          }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "2px",
            border: "1.5px solid var(--color-ink)",
          }}
        />
      ))}
    </div>
  );
}
