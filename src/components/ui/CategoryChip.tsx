import { cn } from "@/lib/utils";
import { getCategoryEmoji } from "@/lib/game/words";

/**
 * Map of known categories to their sticker color tokens.
 * Per docs/design/party-aesthetic.md section 5.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Animals: "var(--color-sticker-lime)",
  Movies: "var(--color-sticker-pink)",
  Sports: "var(--color-sticker-blue)",
  Furniture: "var(--color-sticker-orange)",
  Food: "var(--color-sticker-yellow)",
  Geography: "var(--color-bright-teal)",
  Science: "var(--color-sticker-violet)",
  Music: "var(--color-sticker-pink)",
  Technology: "var(--color-sticker-blue)",
  Travel: "var(--color-sticker-orange)",
  Snacks: "var(--color-sticker-yellow)",
  Holidays: "var(--color-danger)",
};

/** Resolve a CSS color value for a category name; falls back to violet. */
export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? "var(--color-sticker-violet)";
}

interface CategoryChipProps {
  category: string;
  className?: string;
}

export function CategoryChip({ category, className }: CategoryChipProps) {
  if (!category) return null;
  const emoji = getCategoryEmoji(category);
  if (!emoji) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "sticker-border sticker-shadow-sm tilt-right",
        "font-display font-semibold text-lg text-ink",
        className
      )}
      style={{ backgroundColor: categoryColor(category) }}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{category}</span>
    </span>
  );
}
