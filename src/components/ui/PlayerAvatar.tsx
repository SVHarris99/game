import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
  tilt?: boolean;
}

export function PlayerAvatar({
  name,
  color,
  size = "md",
  isActive = false,
  tilt = false,
}: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const tiltClass = tilt
    ? name.charCodeAt(0) % 2 === 0
      ? "tilt-left"
      : "tilt-right"
    : "";

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold shrink-0 sticker-border",
        {
          "w-8 h-8 text-sm": size === "sm",
          "w-10 h-10 text-base": size === "md",
          "w-14 h-14 text-xl": size === "lg",
        },
        isActive &&
          "outline outline-2 outline-bright-teal outline-offset-2",
        tiltClass
      )}
      style={{ backgroundColor: color, color: "var(--color-ink)" }}
    >
      {initial}
    </div>
  );
}
