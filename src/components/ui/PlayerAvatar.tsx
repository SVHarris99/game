import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
}

export function PlayerAvatar({
  name,
  color,
  size = "md",
  isActive = false,
}: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        {
          "w-8 h-8 text-sm": size === "sm",
          "w-10 h-10 text-base": size === "md",
          "w-14 h-14 text-xl": size === "lg",
        },
        isActive && "ring-2 ring-bright-teal ring-offset-2 ring-offset-deep-purple"
      )}
      style={{ backgroundColor: color, color: "#1a0533" }}
    >
      {initial}
    </div>
  );
}
