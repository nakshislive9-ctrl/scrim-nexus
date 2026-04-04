export const GAMES = [
  "Valorant",
  "CS2",
  "Overwatch 2",
  "League of Legends",
  "Rocket League",
  "Apex Legends",
  "Rainbow Six Siege",
  "Dota 2",
  "Fortnite",
  "PUBG",
  "Call of Duty",
  "Deadlock",
] as const;

export const GAME_RANKS: Record<string, string[]> = {
  "Valorant": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
  "CS2": ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master", "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"],
  "Overwatch 2": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion"],
  "League of Legends": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"],
  "Rocket League": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Grand Champion", "Supersonic Legend"],
  "Apex Legends": ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Apex Predator"],
  "Rainbow Six Siege": ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"],
  "Dota 2": ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"],
  "Fortnite": ["Open", "Contender", "Champion", "Unreal"],
  "PUBG": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Dominator", "Conqueror"],
  "Call of Duty": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crimson", "Iridescent", "Top 250"],
  "Deadlock": ["Initiate", "Seeker", "Alchemist", "Arcanist", "Ritualist", "Emissary", "Archon", "Oracle", "Phantom", "Ascendant", "Eternus"],
};

export const MAPS: Record<string, string[]> = {
  "Valorant": ["Ascent", "Bind", "Haven", "Split", "Icebox", "Lotus", "Fracture", "Breeze", "Pearl", "Sunset", "Abyss"],
  "CS2": ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust II"],
  "Overwatch 2": ["Circuit Royal", "Dorado", "Havana", "Junkertown", "Rialto", "Route 66", "Shambali Monastery", "Watchpoint: Gibraltar", "Blizzard World", "Eichenwalde", "Hollywood", "King's Row", "Midtown", "Numbani", "Paraíso"],
  "League of Legends": ["Summoner's Rift"],
  "Rocket League": ["DFH Stadium", "Mannfield", "Champions Field", "Urban Central", "Beckwith Park", "Utopia Coliseum", "Aquadome"],
  "Apex Legends": ["World's Edge", "Storm Point", "Broken Moon", "Kings Canyon", "Olympus"],
  "Rainbow Six Siege": ["Bank", "Border", "Chalet", "Clubhouse", "Coastline", "Consulate", "Kafe Dostoyevsky", "Oregon", "Skyscraper", "Theme Park", "Villa"],
  "Dota 2": ["Default Map"],
  "Fortnite": ["Battle Royale Island"],
  "PUBG": ["Erangel", "Miramar", "Sanhok", "Vikendi", "Taego", "Deston", "Rondo"],
  "Call of Duty": ["Nuketown", "Raid", "Standoff", "Firing Range", "Hijacked", "Slums", "Terminal", "Rust"],
  "Deadlock": ["Default Map"],
};

export const GAME_REGIONS: Record<string, string[]> = {
  "Valorant": ["NA East", "NA West", "EU West", "EU East", "LATAM", "Brazil", "Korea", "Japan", "SEA", "OCE", "Mumbai"],
  "CS2": ["NA East", "NA West", "EU West", "EU North", "EU East", "CIS", "South America", "Asia", "OCE", "India"],
  "Overwatch 2": ["Americas", "Europe", "Asia", "OCE", "India"],
  "League of Legends": ["NA", "EUW", "EUNE", "KR", "JP", "BR", "LAN", "LAS", "OCE", "SEA", "India"],
  "Rocket League": ["US-East", "US-West", "Europe", "Oceania", "South America", "Asia SE-Mainland", "Asia SE-Maritime", "Middle East", "India"],
  "Apex Legends": ["Oregon", "Iowa", "South Carolina", "São Paulo", "London", "Frankfurt", "Belgium", "Singapore", "Tokyo", "Sydney", "Mumbai"],
  "Rainbow Six Siege": ["US East", "US West", "EU West", "EU North", "Brazil", "Asia", "Japan", "Australia", "India"],
  "Dota 2": ["US East", "US West", "EU West", "EU East", "Russia", "SEA", "Australia", "South America", "India", "Japan"],
  "Fortnite": ["NA East", "NA West", "Europe", "Oceania", "Brazil", "Asia", "Middle East", "India"],
  "PUBG": ["NA", "EU", "AS", "SEA", "OC", "SA", "MENA", "India"],
  "Call of Duty": ["Americas", "Europe", "Asia Pacific", "Japan", "India"],
  "Deadlock": ["NA East", "NA West", "Europe", "Asia", "OCE", "South America"],
};

export const GAME_ROLES: Record<string, string[]> = {
  "Valorant": ["Duelist", "Initiator", "Controller", "Sentinel", "Flex", "IGL"],
  "CS2": ["Entry Fragger", "AWPer", "Rifler", "Support", "Lurker", "IGL"],
  "Overwatch 2": ["Tank", "DPS", "Support", "Flex", "IGL"],
  "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Support", "Fill"],
  "Rocket League": ["Striker", "Midfielder", "Defender", "Rotator", "Flex"],
  "Apex Legends": ["Fragger", "Support", "Recon", "IGL", "Flex"],
  "Rainbow Six Siege": ["Hard Breacher", "Soft Breacher", "Entry Fragger", "Anchor", "Roamer", "Support", "IGL", "Flex"],
  "Dota 2": ["Carry", "Mid", "Offlane", "Soft Support", "Hard Support"],
  "Fortnite": ["Fragger", "Support", "IGL", "Flex"],
  "PUBG": ["Fragger", "Support", "IGL", "Scout", "Flex"],
  "Call of Duty": ["Slayer", "OBJ", "Flex", "Support", "IGL"],
  "Deadlock": ["Carry", "Support", "Flex", "IGL"],
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
