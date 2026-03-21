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

export function getRanksForGame(game: string): string[] {
  return GAME_RANKS[game] || [];
}

export function getMapsForGame(game: string): string[] {
  return MAPS[game] || [];
}
