export const GAMES = ["Valorant", "CS2", "Overwatch 2", "League of Legends", "Rocket League"] as const;

export const GAME_RANKS: Record<string, string[]> = {
  "Valorant": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
  "CS2": ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master", "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"],
  "Overwatch 2": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion"],
  "League of Legends": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"],
  "Rocket League": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Grand Champion", "Supersonic Legend"],
};

export const MAPS: Record<string, string[]> = {
  "Valorant": ["Ascent", "Bind", "Haven", "Split", "Icebox", "Lotus", "Fracture", "Breeze", "Pearl", "Sunset", "Abyss"],
  "CS2": ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust II"],
  "Overwatch 2": ["Circuit Royal", "Dorado", "Havana", "Junkertown", "Rialto", "Route 66", "Shambali Monastery", "Watchpoint: Gibraltar", "Blizzard World", "Eichenwalde", "Hollywood", "King's Row", "Midtown", "Numbani", "Paraíso"],
  "League of Legends": ["Summoner's Rift"],
  "Rocket League": ["DFH Stadium", "Mannfield", "Champions Field", "Urban Central", "Beckwith Park", "Utopia Coliseum", "Aquadome"],
};

export const GAME_REGIONS: Record<string, string[]> = {
  "Valorant": ["NA East", "NA West", "EU West", "EU East", "LATAM", "Brazil", "Korea", "Japan", "SEA", "OCE"],
  "CS2": ["NA East", "NA West", "EU West", "EU North", "EU East", "CIS", "South America", "Asia", "OCE"],
  "Overwatch 2": ["Americas", "Europe", "Asia", "OCE"],
  "League of Legends": ["NA", "EUW", "EUNE", "KR", "JP", "BR", "LAN", "LAS", "OCE", "SEA"],
  "Rocket League": ["US-East", "US-West", "Europe", "Oceania", "South America", "Asia SE-Mainland", "Asia SE-Maritime", "Middle East"],
};

export const GAME_ROLES: Record<string, string[]> = {
  "Valorant": ["Duelist", "Initiator", "Controller", "Sentinel", "Flex", "IGL"],
  "CS2": ["Entry Fragger", "AWPer", "Rifler", "Support", "Lurker", "IGL"],
  "Overwatch 2": ["Tank", "DPS", "Support", "Flex", "IGL"],
  "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Support", "Fill"],
  "Rocket League": ["Striker", "Midfielder", "Defender", "Rotator", "Flex"],
};

export function getRanksForGame(game: string): string[] {
  return GAME_RANKS[game] || [];
}

export function getMapsForGame(game: string): string[] {
  return MAPS[game] || [];
}

export function getRegionsForGame(game: string): string[] {
  return GAME_REGIONS[game] || [];
}

export function getRolesForGame(game: string): string[] {
  return GAME_ROLES[game] || [];
}

