# Party-Game Aesthetic — Source of Truth

Sticker / cartoon / Jackbox-style for The Odd One Out.
This doc is the canonical reference for Tasks 2–7 in `/Users/brennenharris/.claude/plans/vivid-growing-mccarthy.md`. If a component deviates, update this doc first.

---

## 1. Palette — Final Tokens

Add these to `src/app/globals.css` inside the existing `@theme inline` block. Keep all current tokens; these are additions/overrides.

```css
@theme inline {
  /* Existing — keep */
  --color-deep-purple: #1a0533;
  --color-purple-light: #2d1052;
  --color-purple-mid: #3d1a6e;
  --color-surface-elevated: #1e0a3c;
  --color-bright-teal: #00e5a0;
  --color-teal-dim: #00b87d;
  --color-danger: #ff4d6a;
  --color-gold: #ffd700;

  /* NEW — sticker accent palette */
  --color-sticker-pink:   #ff5cb8;
  --color-sticker-blue:   #4cc9f0;
  --color-sticker-yellow: #ffd23f;
  --color-sticker-lime:   #b8f84b;
  --color-sticker-orange: #ff8c42;
  --color-sticker-violet: #a855f7;

  /* NEW — sticker structural */
  --color-ink: #0a0014;        /* near-black for borders / offset shadows */
  --color-paper: #fff8e7;      /* warm cream for sticker-card interiors used sparingly as contrast */
}
```

**Usage contract:**
- Backgrounds & chrome: `deep-purple`, `purple-light`, `surface-elevated` (unchanged).
- Hero CTAs & success: `bright-teal`.
- Destructive / imposter / voting: `danger`.
- #1 scoreboard / crown / champion: `gold`.
- **Category chips, sticker cards, avatars, confetti**: cycle through the six sticker accents. Map categories → colors deterministically (hash of name) so each category is always the same color.
- **Borders & offset shadows**: always `--color-ink` (#0a0014). No other outline color.
- `--color-paper`: reserved for the "role reveal word card" and the "ESCAPED!" stamp interior, where we want that cream-sticker pop.

**Contrast notes (a11y):**
- White text on any sticker accent passes ≥ 4.5:1 for body-size copy — prefer this combo.
- Ink text (`--color-ink`) on yellow / lime / cream is required (white fails).

---

## 2. Typography

**Display:** **Fredoka** (weights 500, 600, 700) — rounded, chunky, playful but readable.
**Body:** keep **Space Grotesk** (already loaded). Fredoka recommended against Nunito for body, but the project already ships with Space Grotesk which is more distinctive and still pairs cleanly with Fredoka's roundness.

Load both via `next/font/google` in `src/app/layout.tsx` and expose as CSS variables:

```ts
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-body" });
```

**Usage:**
- `h1` / hero titles / phase titles / room code / stamp words → `font-family: var(--font-display)`
- Body, clues, player names, buttons → `var(--font-body)`
- Add a `.font-display` utility via `@theme inline` for ergonomic per-element application.

---

## 3. Signature Utilities

Append to `globals.css` (outside `@theme`, as plain CSS):

```css
/* Sticker shadow — chunky, no blur */
.sticker-shadow { box-shadow: 6px 6px 0 var(--color-ink); }
.sticker-shadow-sm { box-shadow: 4px 4px 0 var(--color-ink); }
.sticker-shadow-lg { box-shadow: 8px 8px 0 var(--color-ink); }

/* Thick ink outline */
.sticker-border { border: 3px solid var(--color-ink); }
.sticker-border-thick { border: 4px solid var(--color-ink); }

/* Subtle tilts — additive, compose with transforms via CSS variable */
.tilt-left  { --tilt: -2deg; transform: rotate(var(--tilt)); }
.tilt-right { --tilt:  2deg; transform: rotate(var(--tilt)); }
.tilt-lean  { --tilt: -4deg; transform: rotate(var(--tilt)); }

/* Press-down state (compose with sticker-shadow) */
.sticker-press { transition: transform 80ms ease-out, box-shadow 80ms ease-out; }
.sticker-press:active { transform: translate(4px, 4px); box-shadow: 2px 2px 0 var(--color-ink); }

/* Dotted/confetti bg pattern on body */
.bg-confetti {
  background-color: var(--color-deep-purple);
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 92, 184, 0.08) 1.5px, transparent 2px),
    radial-gradient(circle at 70% 60%, rgba(76, 201, 240, 0.08) 1.5px, transparent 2px),
    radial-gradient(circle at 40% 85%, rgba(255, 210, 63, 0.08) 1.5px, transparent 2px);
  background-size: 180px 180px, 240px 240px, 200px 200px;
  background-position: 0 0, 60px 30px, 120px 80px;
}

/* Reduced-motion guard — skip tilts + press when user prefers */
@media (prefers-reduced-motion: reduce) {
  .tilt-left, .tilt-right, .tilt-lean { transform: none; }
  .sticker-press:active { transform: none; }
}
```

---

## 4. Motion Language (framer-motion)

Standard transition objects, reused everywhere:

```ts
export const spring = { type: "spring", stiffness: 420, damping: 22 };
export const bouncySpring = { type: "spring", stiffness: 500, damping: 14 }; // for entrances w/ overshoot
export const quickTween = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };
```

**Patterns:**
- **Entrance (cards, chips, stamps):** `initial: { scale: 0, rotate: -8 }`, `animate: { scale: 1, rotate: 0 }`, `transition: bouncySpring` (overshoots, then settles).
- **Stagger:** child delay `0.06s` between items (lobby players, clue cards, scoreboard rows).
- **Button press:** rely on `.sticker-press:active` CSS (transform translate + shadow shrink) rather than framer-motion — snappier.
- **Phase transition:** `initial: { opacity: 0, y: 24 }` → `animate: { opacity: 1, y: 0 }` via AnimatePresence.

Respect `prefers-reduced-motion` globally — framer-motion honors it if you set `MotionConfig reducedMotion="user"` in `GameShell`.

---

## 5. Category → Color Map

Deterministic map for the 12 categories. Implementer can also compute via hash, but this is the approved reference.

| Category     | Color token                 | Emoji |
|--------------|-----------------------------|-------|
| Animals      | `--color-sticker-lime`      | 🦁    |
| Movies       | `--color-sticker-pink`      | 🎬    |
| Sports       | `--color-sticker-blue`      | ⚽    |
| Furniture    | `--color-sticker-orange`    | 🛋️    |
| Food         | `--color-sticker-yellow`    | 🍕    |
| Geography    | `--color-bright-teal`       | 🗺️    |
| Science      | `--color-sticker-violet`    | 🔬    |
| Music        | `--color-sticker-pink`      | 🎵    |
| Technology   | `--color-sticker-blue`      | 💻    |
| Travel       | `--color-sticker-orange`    | ✈️    |
| Snacks       | `--color-sticker-yellow`    | 🍿    |
| Holidays     | `--color-danger`            | 🎄    |

(Colors repeat intentionally across 12 categories using 8 tokens — that's fine; what matters is the category→color pairing is stable within a session.)

---

## 6. Component Mockups

### 6.1 Landing page hero (`src/app/page.tsx`)

```
 ┌──────────────────────────────────────────────────────────────┐
 │    bg: deep-purple + .bg-confetti                             │
 │                                                               │
 │             ╔══════════════════════════════╗                 │
 │             ║                              ║  <tilt-left     │
 │       🎭    ║    THE  ODD  ONE  OUT        ║   sticker-shadow│
 │             ║                              ║   sticker-border│
 │             ║  a sneaky little party game  ║   bg: violet    │
 │             ╚══════════════════════════════╝                 │
 │                                                               │
 │        ┌─────────────────┐   ┌─────────────────┐              │
 │        │  ▶  NEW ROOM    │   │  ↪  JOIN ROOM   │              │
 │        └─────────────────┘   └─────────────────┘              │
 │        teal sticker btn       yellow sticker btn              │
 │                                                               │
 │      floating emoji doodles at corners (🎉 🎲 🎤)             │
 └──────────────────────────────────────────────────────────────┘
```
- Hero card: bg `--color-sticker-violet`, `sticker-border`, `sticker-shadow-lg`, `tilt-left`, Fredoka 700 uppercase for title.
- Two buttons side-by-side on desktop, stacked on mobile. Each `sticker-border` + `sticker-shadow-sm` + `sticker-press`.
- Decorative emoji doodles absolutely positioned, `tilt-lean` rotations, low-opacity `motion.div` with slow float animation.

### 6.2 Lobby room-code card (`LobbyPhase.tsx`)

```
              ╔═════════════════════════╗
              ║                         ║
              ║      ROOM CODE          ║    <sticker-border
              ║                         ║     sticker-shadow-lg
              ║        A B 3 K          ║     tilt-right (2deg)
              ║                         ║     bg: --color-paper
              ║     ( tap to copy )     ║     text: --color-ink
              ╚═════════════════════════╝     Fredoka 700, huge

     Players (3/8)
     ┌───┐ ┌───┐ ┌───┐ ┌───┐  <sticker player chips
     │ B │ │ A │ │ S │ │ + │     bouncy staggered entrance
     └───┘ └───┘ └───┘ └───┘     each: ink border, color from avatarColor
      Ben   Ava   Sam   (wait)

     [  ▶   START GAME  ]    host-only, teal sticker btn
```
- Room code uses `--color-paper` (cream) interior with `--color-ink` text — one of the rare cream-on-dark moments. Gives strongest "sticker" pop.
- Player chips: colored circle avatar stacked over a small label card; the chip as a whole has `sticker-border` + `sticker-shadow-sm`.

### 6.3 Clue phase category chip (`CluePhase.tsx`)

```
   ┌──────────────────┐
   │  🦁  Animals     │   <- CategoryChip
   └──────────────────┘      bg: category color (lime)
                             text: --color-ink, Fredoka 700
                             sticker-border, sticker-shadow-sm
                             tilt-right, inline-flex gap-2 px-4 py-2

   Turn 2 of 4  •  Ava's turn
   ┌─────────────────────────────────────┐
   │  "something that purrs"      — Ben  │   <- clue sticker card (pink)
   └─────────────────────────────────────┘      entering from left, bouncy
   ┌─────────────────────────────────────┐
   │  "has a tail"                — Ava  │   <- next card (blue)
   └─────────────────────────────────────┘      stagger 0.08s

   [  type your clue…        ] [ send ]  <- chunky input + teal btn
```
- CategoryChip is its own component (`src/components/ui/CategoryChip.tsx`). Takes `category: string`. Looks up emoji via `getCategoryEmoji`, color via a small client-side `categoryColor(name)` util (hash or map).
- Each clue card cycles through sticker colors in order (not by speaker), creating visual rhythm.

### 6.4 Results — winner stamp (`ResultsPhase.tsx`)

```
               (confetti burst — radial from center,       )
               (sticker-colored squares, spring-thrown out  )

                      ╭─────────────────────╮
                     │                       │    rubber-stamp
                     │     INSIDERS WIN!     │    Fredoka 700, uppercase
                     │                       │    rotate -6deg
                      ╰─────────────────────╯    bg: --color-bright-teal
                                                 border: 4px --color-ink
                                                 sticker-shadow-lg
                                                 initial scale 2 + rotate -30 → settle

   The word was:  PENGUIN
   The imposter:  Sam  ╳ (red x stamp)

   ┌───────────────────────────────────────┐
   │  1. Ben   ••••••••••  6 pts   👑 gold │   <- scoreboard, #1 = gold sticker
   │  2. Ava   •••••••     4 pts           │
   │  3. Sam   ••          1 pt            │
   └───────────────────────────────────────┘

   [ Play Again ]  [ Back to Lobby ]
```
- Two stamp variants: **INSIDERS WIN!** (teal bg) when imposter caught; **ESCAPED!** (cream/paper bg, red ink, tilted +8deg) when imposter survives; **CAUGHT!** as a sub-stamp over imposter's avatar either way.
- Confetti: 40–60 small `motion.div` squares in sticker palette, initial position center, animated to random radial targets with `bouncySpring` + rotation, opacity fade. Only mounts on insiders-win and respects `prefers-reduced-motion`.
- Scoreboard rank #1: full row bg `--color-gold`, ink text, crown emoji, `tilt-left` micro.

---

## 7. Intentional Exceptions to `ui-ux-pro-max` Checklist

- **Emojis are NOT icons here** — they're category content (the theme the players are playing with). They stay. SVG icons (Heroicons / Lucide) still apply to UI affordances: send, copy, mute, trophy, etc. Rule: emoji = gameplay content; SVG = UI controls.
- **Layout shift on press** — the sticker press animation *does* intentionally shift position (translate 4px, 4px). This is a well-known sticker/press pattern and user-desired. Mitigated by (a) tiny offset, (b) only on `:active` (momentary), (c) respects reduced-motion.

Everything else on the a11y checklist (cursor, focus rings, contrast ≥ 4.5:1, reduced-motion, responsive breakpoints) stands.
