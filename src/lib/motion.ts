// Shared framer-motion transition tokens — see docs/design/party-aesthetic.md §4

export const spring = { type: "spring" as const, stiffness: 420, damping: 22 };

export const bouncySpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 14,
};

export const quickTween = {
  duration: 0.18,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};
