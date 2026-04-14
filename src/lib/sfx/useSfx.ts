"use client";

// TODO: Drop real CC0 audio files into /public/sfx/ — current files are 0-byte
// placeholders. The hook below tolerates missing/failed audio silently, so the
// app works fine until real assets are sourced.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SfxName = "join" | "phase" | "click" | "correct" | "wrong";

const SFX_SRC: Record<SfxName, string> = {
  join: "/sfx/join.mp3",
  phase: "/sfx/phase.mp3",
  click: "/sfx/click.mp3",
  correct: "/sfx/correct.mp3",
  wrong: "/sfx/wrong.mp3",
};

const STORAGE_KEY = "sfx-muted";

interface SfxContextValue {
  play: (name: SfxName) => void;
  muted: boolean;
  toggleMute: () => void;
}

const SfxContext = createContext<SfxContextValue | null>(null);

export function SfxProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState<boolean>(false);
  const audiosRef = useRef<Partial<Record<SfxName, HTMLAudioElement>>>({});
  const hydratedRef = useRef(false);

  // Hydrate muted state from localStorage on mount (client only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "boolean") setMuted(parsed);
      }
    } catch {
      /* ignore */
    }
    hydratedRef.current = true;
  }, []);

  // Persist changes to muted.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(muted));
    } catch {
      /* ignore */
    }
  }, [muted]);

  // Preload audio objects lazily on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    (Object.keys(SFX_SRC) as SfxName[]).forEach((name) => {
      if (audiosRef.current[name]) return;
      try {
        const audio = new Audio(SFX_SRC[name]);
        audio.preload = "auto";
        audio.volume = 0.6;
        audiosRef.current[name] = audio;
      } catch {
        /* ignore */
      }
    });
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      if (muted) return;
      if (typeof window === "undefined") return;
      let audio = audiosRef.current[name];
      if (!audio) {
        try {
          audio = new Audio(SFX_SRC[name]);
          audio.volume = 0.6;
          audiosRef.current[name] = audio;
        } catch {
          return;
        }
      }
      try {
        audio.currentTime = 0;
      } catch {
        /* some browsers throw if not loaded */
      }
      try {
        const result = audio.play();
        if (result && typeof result.catch === "function") {
          result.catch(() => {
            /* autoplay blocked / decode error — fail silent */
          });
        }
      } catch {
        /* fail silent */
      }
    },
    [muted]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const value = useMemo<SfxContextValue>(
    () => ({ play, muted, toggleMute }),
    [play, muted, toggleMute]
  );

  return createElement(SfxContext.Provider, { value }, children);
}

export function useSfx(): SfxContextValue {
  const ctx = useContext(SfxContext);
  if (!ctx) {
    // Fallback no-op so components can call useSfx() safely even outside
    // the provider (e.g. in isolated tests). Does not persist or play.
    return {
      play: () => {},
      muted: false,
      toggleMute: () => {},
    };
  }
  return ctx;
}
