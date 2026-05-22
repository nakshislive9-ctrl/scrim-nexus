// Brand logos via SimpleIcons CDN (monochrome SVGs tinted to current color).
// Falls back to a Gamepad icon when no slug is available.
export const GAME_LOGO_SLUGS: Record<string, string> = {
  "Valorant": "valorant",
  "CS2": "counterstrike",
  "Overwatch 2": "overwatch",
  "League of Legends": "leagueoflegends",
  "Rocket League": "rocketleague",
  "Apex Legends": "apexlegends",
  "Rainbow Six Siege": "ubisoft",
  "Dota 2": "dota2",
  "Fortnite": "epicgames",
  "PUBG": "pubg",
  "Call of Duty": "callofduty",
  "Deadlock": "valve",
};

export function getGameLogoUrl(game: string, hex: string = "22d3ee"): string | null {
  const slug = GAME_LOGO_SLUGS[game];
  if (!slug) return null;
  // Strip leading #
  const color = hex.replace(/^#/, "");
  return `https://cdn.simpleicons.org/${slug}/${color}`;
}
