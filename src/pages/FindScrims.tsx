import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Search, Filter, Crosshair, Shield, Globe, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GAMES, getRanksForGame, getRegionsForGame } from "@/lib/gameData";

interface ScrimListing {
  id: string;
  teamName: string;
  game: string;
  rank: string;
  region: string;
  reliability: number;
  timeSlot: string;
  mapPreferences: string[];
}

const mockListings: ScrimListing[] = [
  { id: "1", teamName: "Team Phantom", game: "Valorant", rank: "Immortal", region: "NA East", reliability: 92, timeSlot: "8:00 PM EST", mapPreferences: ["Ascent", "Haven"] },
  { id: "2", teamName: "Eclipse Gaming", game: "Valorant", rank: "Diamond", region: "EU West", reliability: 87, timeSlot: "9:30 PM CET", mapPreferences: ["Bind", "Split"] },
  { id: "3", teamName: "Midnight Wolves", game: "CS2", rank: "Global Elite", region: "NA West", reliability: 95, timeSlot: "7:00 PM PST", mapPreferences: ["Mirage", "Inferno"] },
  { id: "4", teamName: "Crimson Tigers", game: "Valorant", rank: "Platinum", region: "Asia", reliability: 78, timeSlot: "10:00 PM JST", mapPreferences: ["Lotus", "Fracture"] },
  { id: "5", teamName: "Arctic Storm", game: "Overwatch 2", rank: "Master", region: "EU East", reliability: 91, timeSlot: "8:00 PM EET", mapPreferences: ["Havana", "Circuit Royal"] },
  { id: "6", teamName: "Nova Esports", game: "Valorant", rank: "Radiant", region: "NA East", reliability: 98, timeSlot: "9:00 PM EST", mapPreferences: ["Ascent", "Icebox"] },
];

function getReliabilityColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-warning";
  return "text-destructive";
}

export default function FindScrims() {
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const availableRanks = filterGame ? getRanksForGame(filterGame) : [];
  const availableRegions = filterGame ? getRegionsForGame(filterGame) : [];

  const filtered = mockListings.filter((l) => {
    if (search && !l.teamName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGame && l.game !== filterGame) return false;
    if (filterRank && l.rank !== filterRank) return false;
    if (filterRegion && l.region !== filterRegion) return false;
    return true;
  });

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find Scrims</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse open challenges and find your next opponent</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/50 border border-border/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
              <select
                value={filterGame}
                onChange={(e) => { setFilterGame(e.target.value); setFilterRank(""); setFilterRegion(""); }}
                className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Games</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
                className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={!filterGame}
              >
                <option value="">{filterGame ? "All Ranks" : "Select a game first"}</option>
                {availableRanks.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={!filterGame}
              >
                <option value="">{filterGame ? "All Regions" : "Select a game first"}</option>
                {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {(filterGame || filterRank || filterRegion) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterGame(""); setFilterRank(""); setFilterRegion(""); }} className="text-muted-foreground text-xs">
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Listings */}
        <StaggerContainer className="space-y-3">
          {filtered.map((listing) => (
            <StaggerItem key={listing.id}>
              <div className="glass-panel-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-foreground">{listing.teamName}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">{listing.rank}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Crosshair className="h-3 w-3" /> {listing.game}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" /> {listing.region}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {listing.timeSlot}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-mono font-medium ${getReliabilityColor(listing.reliability)}`}>
                      <Shield className="h-3 w-3" /> {listing.reliability}%
                    </span>
                  </div>
                </div>
                <Button variant="neon" size="sm" className="shrink-0">
                  <Crosshair className="h-3.5 w-3.5 mr-1.5" />
                  Challenge
                </Button>
              </div>
            </StaggerItem>
          ))}
          {filtered.length === 0 && (
            <div className="glass-panel p-12 text-center">
              <Crosshair className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scrims match your filters</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setFilterGame(""); setFilterRank(""); }}>Reset Filters</Button>
            </div>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
