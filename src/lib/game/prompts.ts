import prompts from "@/lib/words/prompts.json" with { type: "json" };
import { shuffle } from "@/lib/utils";
import type { PromptPair } from "@/types/game";

/** Select `n` random prompt pairs without repeats. */
export function selectPrompts(n: number): PromptPair[] {
  return shuffle(prompts.pairs).slice(0, n);
}
