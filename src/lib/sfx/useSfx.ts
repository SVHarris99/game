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

  // NOTE: We intentionally do NOT preload audio on mount. The files in
  // /public/sfx/*.mp3 are currently 0-byte placeholders. To avoid HTTP 416
  // "Range Not Satisfiable" responses on every play attempt, we probe each
  // asset once via HEAD. If the file is missing or empty, we mark the sound
  // dead and skip it forever (no further network requests). All load/decode/
  // play errors are additionally silently swallowed as a belt-and-braces.
  const deadRef = useRef<Partial<Record<SfxName, boolean>>>({});
  const probedRef = useRef<Partial<Record<SfxName, Promise<boolean>>>>({});

  const probeAsset = useCallback((name: SfxName): Promise<boolean> => {
    const cached = probedRef.current[name];
    if (cached) return cached;
    const promise = (async () => {
      try {
        const res = await fetch(SFX_SRC[name], { method: "HEAD" });
        if (!res.ok) return false;
        const len = res.headers.get("Content-Length");
        if (len !== null && Number(len) <= 0) return false;
        return true;
      } catch {
        return false;
      }
    })().then((ok) => {
      if (!ok) deadRef.current[name] = true;
      return ok;
    });
    probedRef.current[name] = promise;
    return promise;
  }, []);

  const silenceAudioErrors = (audio: HTMLAudioElement) => {
    const swallow = (e: Event) => {
      e.stopPropagation();
      // Prevent the default "Uncaught (in promise)" style logging where possible
      if (typeof (e as Event).preventDefault === "function") e.preventDefault();
    };
    audio.addEventListener("error", swallow);
    audio.addEventListener("stalled", swallow);
    audio.addEventListener("abort", swallow);
  };

  const play = useCallback(
    (name: SfxName) => {
      if (muted) return;
      if (typeof window === "undefined") return;
      if (deadRef.current[name]) return;

      // Fire-and-forget probe; actual playback only happens when probe resolves
      // truthy. First call for a given sound has a small delay (one HEAD
      // request); subsequent calls are synchronous because the probe is cached.
      void probeAsset(name).then((ok) => {
        if (!ok) return;
        let audio = audiosRef.current[name];
        if (!audio) {
          try {
            audio = new Audio();
            audio.preload = "none";
            audio.volume = 0.6;
            silenceAudioErrors(audio);
            audio.src = SFX_SRC[name];
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
      });
    },
    [muted, probeAsset]
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
