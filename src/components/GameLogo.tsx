import { Gamepad2 } from "lucide-react";
import { getGameLogoUrl } from "@/lib/gameLogos";
import { cn } from "@/lib/utils";

interface GameLogoProps {
  game: string;
  className?: string;
  /** Hex color (no #) for the monochrome logo tint. Defaults to primary cyan. */
  colorHex?: string;
}

export function GameLogo({ game, className, colorHex = "22d3ee" }: GameLogoProps) {
  const url = getGameLogoUrl(game, colorHex);
  if (!url) {
    return <Gamepad2 className={cn("h-6 w-6", className)} />;
  }
  return (
    <img
      src={url}
      alt={`${game} logo`}
      loading="lazy"
      className={cn("h-6 w-6 object-contain", className)}
    />
  );
}
