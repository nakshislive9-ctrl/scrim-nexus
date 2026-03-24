import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Search, Filter, ChevronDown, UserPlus, Users, Crosshair, Globe, Shield, Trophy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { GAMES, getRanksForGame, getRegionsForGame, getRolesForGame } from "@/lib/gameData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { toast } from "sonner";

interface PlayerListing {
  id: string;
  user_id: string;
  listing_type: string;
  game: string;
  rank: string;
  role: string | null;
  region: string | null;
  level: string | null;
  ign: string;
  description: string | null;
  team_id: string | null;
  created_at: string;
  team_name?: string;
}

export default function FindPlayers() {
  const { user } = useAuth();
  const { team } = useTeam();
  const [activeTab, setActiveTab] = useState<"players" | "teams">("players");
  const [search, setSearch] = useState("");
  const [filterGame, setFilterGame] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<PlayerListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Post listing state
  const [showPostForm, setShowPostForm] = useState(false);
  const [postGame, setPostGame] = useState("");
  const [postRank, setPostRank] = useState("");
  const [postRole, setPostRole] = useState("");
  const [postRegion, setPostRegion] = useState("");
  const [postLevel, setPostLevel] = useState("");
  const [postIgn, setPostIgn] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User's own listing
  const [myListing, setMyListing] = useState<PlayerListing | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const listingType = activeTab === "players" ? "player_looking_for_team" : "team_looking_for_player";

    const { data } = await supabase
      .from("player_listings")
      .select("*")
      .eq("listing_type", listingType)
      .neq("user_id", user?.id ?? "")
      .order("created_at", { ascending: false });

    // For team listings, fetch team names
    if (data && activeTab === "teams") {
      const teamIds = data.filter(d => d.team_id).map(d => d.team_id);
      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", teamIds as string[]);
        const teamMap = new Map(teams?.map(t => [t.id, t.name]) ?? []);
      data.forEach(d => {
          if (d.team_id) (d as any).team_name = teamMap.get(d.team_id) ?? undefined;
        });
      }
    }

    setListings((data as PlayerListing[]) ?? []);
    setLoading(false);
  };

  const fetchMyListing = async () => {
    const listingType = activeTab === "players" ? "player_looking_for_team" : "team_looking_for_player";
    const { data } = await supabase
      .from("player_listings")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .eq("listing_type", listingType)
      .maybeSingle();
    setMyListing(data as PlayerListing | null);
  };

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchMyListing();
    }
  }, [user, activeTab]);

  const handlePost = async () => {
    if (!postIgn.trim() || !postGame || !postRank) {
      toast.error("IGN, Game, and Rank are required");
      return;
    }
    setSubmitting(true);
    const listingType = activeTab === "players" ? "player_looking_for_team" : "team_looking_for_player";
    const { error } = await supabase.from("player_listings").insert({
      user_id: user!.id,
      listing_type: listingType,
      game: postGame,
      rank: postRank,
      role: postRole || null,
      region: postRegion || null,
      level: postLevel || null,
      ign: postIgn,
      description: postDescription || null,
      team_id: activeTab === "teams" ? team?.id ?? null : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing posted!");
      setShowPostForm(false);
      resetForm();
      fetchListings();
      fetchMyListing();
    }
  };

  const handleDeleteListing = async () => {
    if (!myListing) return;
    const { error } = await supabase.from("player_listings").delete().eq("id", myListing.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing removed");
      setMyListing(null);
      fetchListings();
    }
  };

  const resetForm = () => {
    setPostGame("");
    setPostRank("");
    setPostRole("");
    setPostRegion("");
    setPostLevel("");
    setPostIgn("");
    setPostDescription("");
  };

  const availableRanks = filterGame ? getRanksForGame(filterGame) : [];
  const availableRegions = filterGame ? getRegionsForGame(filterGame) : [];
  const availableRoles = filterGame ? getRolesForGame(filterGame) : [];

  const postRanks = postGame ? getRanksForGame(postGame) : [];
  const postRegions = postGame ? getRegionsForGame(postGame) : [];
  const postRoles = postGame ? getRolesForGame(postGame) : [];

  const filtered = listings.filter((l) => {
    if (search && !l.ign.toLowerCase().includes(search.toLowerCase()) && !(l.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGame && l.game !== filterGame) return false;
    if (filterRank && l.rank !== filterRank) return false;
    if (filterRegion && l.region !== filterRegion) return false;
    if (filterRole && l.role !== filterRole) return false;
    return true;
  });

  const selectClass = "bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  const inputClass = "w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Find Players</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "players" ? "Solo players looking for a team" : "Teams recruiting new members"}
            </p>
          </div>
          <div className="flex gap-2">
            {myListing ? (
              <Button variant="outline" size="sm" onClick={handleDeleteListing} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                <X className="h-3.5 w-3.5" /> Remove My Listing
              </Button>
            ) : (
              <Button variant="neon" size="sm" onClick={() => setShowPostForm(!showPostForm)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Post Listing
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/30 w-fit">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "players" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Players LFT
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "teams" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Teams Recruiting
          </button>
        </div>

        {/* Post Form */}
        {showPostForm && (
          <div className="glass-panel p-5 space-y-4 border-primary/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {activeTab === "players" ? "Post as a Player" : "Post as a Team"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Your IGN *" value={postIgn} onChange={(e) => setPostIgn(e.target.value)} className={inputClass} />
              <select value={postGame} onChange={(e) => { setPostGame(e.target.value); setPostRank(""); setPostRole(""); setPostRegion(""); }} className={selectClass}>
                <option value="">Select Game *</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={postRank} onChange={(e) => setPostRank(e.target.value)} className={selectClass} disabled={!postGame}>
                <option value="">{postGame ? "Select Rank *" : "Select game first"}</option>
                {postRanks.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={postRole} onChange={(e) => setPostRole(e.target.value)} className={selectClass} disabled={!postGame}>
                <option value="">{postGame ? "Select Role" : "Select game first"}</option>
                {postRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={postRegion} onChange={(e) => setPostRegion(e.target.value)} className={selectClass} disabled={!postGame}>
                <option value="">{postGame ? "Select Region" : "Select game first"}</option>
                {postRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="number" min="0" placeholder="Level" value={postLevel} onChange={(e) => setPostLevel(e.target.value)} className={inputClass} />
            </div>
            <textarea placeholder="Short description (optional)" value={postDescription} onChange={(e) => setPostDescription(e.target.value)} rows={2}
              className={`${inputClass} resize-none`} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowPostForm(false); resetForm(); }}>Cancel</Button>
              <Button variant="neon" size="sm" onClick={handlePost} disabled={submitting}>
                {submitting ? "Posting..." : "Post Listing"}
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search by IGN or description..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/50 border border-border/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" /> Filters
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
              <select value={filterGame} onChange={(e) => { setFilterGame(e.target.value); setFilterRank(""); setFilterRegion(""); setFilterRole(""); }} className={selectClass}>
                <option value="">All Games</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)} className={selectClass} disabled={!filterGame}>
                <option value="">{filterGame ? "All Ranks" : "Select game first"}</option>
                {availableRanks.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass} disabled={!filterGame}>
                <option value="">{filterGame ? "All Roles" : "Select game first"}</option>
                {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={selectClass} disabled={!filterGame}>
                <option value="">{filterGame ? "All Regions" : "Select game first"}</option>
                {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {(filterGame || filterRank || filterRegion || filterRole) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterGame(""); setFilterRank(""); setFilterRegion(""); setFilterRole(""); }} className="text-muted-foreground text-xs">
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StaggerContainer className="space-y-3">
            {filtered.map((l) => (
              <StaggerItem key={l.id}>
                <div className="glass-panel-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-foreground">{l.ign}</h3>
                      {activeTab === "teams" && l.team_name && (
                        <Badge variant="outline" className="text-[10px] font-mono border-warning/30 text-warning">{l.team_name}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">{l.rank}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Crosshair className="h-3 w-3" /> {l.game}
                      </span>
                      {l.role && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" /> {l.role}
                        </span>
                      )}
                      {l.region && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" /> {l.region}
                        </span>
                      )}
                      {l.level && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Trophy className="h-3 w-3" /> Lv.{l.level}
                        </span>
                      )}
                    </div>
                    {l.description && (
                      <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-1">{l.description}</p>
                    )}
                  </div>
                  <Button variant="neon" size="sm" className="shrink-0">
                    {activeTab === "players" ? (
                      <><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Recruit</>
                    ) : (
                      <><Users className="h-3.5 w-3.5 mr-1.5" /> Apply</>
                    )}
                  </Button>
                </div>
              </StaggerItem>
            ))}
            {filtered.length === 0 && (
              <div className="glass-panel p-12 text-center">
                <UserPlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === "players" ? "No players looking for a team right now" : "No teams recruiting right now"}
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setFilterGame(""); setFilterRank(""); setFilterRegion(""); setFilterRole(""); }}>
                  Reset Filters
                </Button>
              </div>
            )}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
