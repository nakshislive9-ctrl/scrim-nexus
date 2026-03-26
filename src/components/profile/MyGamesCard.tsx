import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GAMES, getRolesForGame, getRanksForGame, getRegionsForGame } from "@/lib/gameData";
import { toast } from "sonner";
import { Gamepad2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserGame {
  id: string;
  game: string;
  rank: string | null;
  role: string | null;
  region: string | null;
  ign: string | null;
}

export default function MyGamesCard() {
  const { user } = useAuth();
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New game form
  const [newGame, setNewGame] = useState("");
  const [newRank, setNewRank] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newIgn, setNewIgn] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRank, setEditRank] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editIgn, setEditIgn] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchGames = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_games")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, [user]);

  const availableGames = GAMES.filter((g) => !games.some((ug) => ug.game === g));

  const handleAddGame = async () => {
    if (!user || !newGame) return;
    setSavingNew(true);
    try {
      const { error } = await supabase.from("user_games").insert({
        user_id: user.id,
        game: newGame,
        rank: newRank || null,
        role: newRole || null,
        region: newRegion || null,
        ign: newIgn.trim() || null,
      });
      if (error) throw error;
      toast.success(`${newGame} added to your profile`);
      setNewGame("");
      setNewRank("");
      setNewRole("");
      setNewRegion("");
      setNewIgn("");
      setAdding(false);
      await fetchGames();
    } catch {
      toast.error("Failed to add game");
    } finally {
      setSavingNew(false);
    }
  };

  const handleDelete = async (id: string, gameName: string) => {
    const { error } = await supabase.from("user_games").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove game");
    } else {
      setGames((prev) => prev.filter((g) => g.id !== id));
      toast.success(`${gameName} removed`);
    }
  };

  const startEdit = (g: UserGame) => {
    setEditingId(g.id);
    setExpandedId(g.id);
    setEditRank(g.rank ?? "");
    setEditRole(g.role ?? "");
    setEditRegion(g.region ?? "");
    setEditIgn(g.ign ?? "");
  };

  const handleSaveEdit = async (g: UserGame) => {
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("user_games")
        .update({
          rank: editRank || null,
          role: editRole || null,
          region: editRegion || null,
          ign: editIgn.trim() || null,
        })
        .eq("id", g.id);
      if (error) throw error;
      toast.success(`${g.game} updated`);
      setEditingId(null);
      await fetchGames();
    } catch {
      toast.error("Failed to update game");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-primary tracking-wider uppercase">Games I Play</span>
        </div>
        {availableGames.length > 0 && !adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Game
          </Button>
        )}
      </div>

      {games.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-4">No games added yet. Click "Add Game" to get started.</p>
      )}

      <div className="space-y-2">
        {games.map((g) => {
          const isExpanded = expandedId === g.id;
          const isEditing = editingId === g.id;
          const roles = getRolesForGame(g.game);
          const ranks = getRanksForGame(g.game);
          const regions = getRegionsForGame(g.game);

          return (
            <div key={g.id} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : g.id);
                  if (isEditing && isExpanded) setEditingId(null);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{g.game}</span>
                  {g.rank && <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{g.rank}</span>}
                  {g.role && <span className="text-xs text-muted-foreground">{g.role}</span>}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/30">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">IGN</label>
                          <Input value={editIgn} onChange={(e) => setEditIgn(e.target.value)} className="mt-1 h-8 text-sm" maxLength={30} />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Rank</label>
                          <Select value={editRank} onValueChange={setEditRank}>
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select rank" /></SelectTrigger>
                            <SelectContent>{ranks.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Role</label>
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Region</label>
                          <Select value={editRegion} onValueChange={setEditRegion}>
                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                            <SelectContent>{regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button variant="neon" size="sm" className="h-7 text-xs" onClick={() => handleSaveEdit(g)} disabled={savingEdit}>
                          {savingEdit ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">IGN</label>
                          <p className="text-sm font-medium mt-0.5">{g.ign || "—"}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Rank</label>
                          <p className="text-sm font-medium mt-0.5">{g.rank || "—"}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Role</label>
                          <p className="text-sm font-medium mt-0.5">{g.role || "—"}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Region</label>
                          <p className="text-sm font-medium mt-0.5">{g.region || "—"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(g)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(g.id, g.game)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-primary/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Game</label>
              <Select value={newGame} onValueChange={(v) => { setNewGame(v); setNewRank(""); setNewRole(""); setNewRegion(""); }}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>{availableGames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {newGame && (
              <>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">IGN</label>
                  <Input value={newIgn} onChange={(e) => setNewIgn(e.target.value)} className="mt-1 h-8 text-sm" maxLength={30} placeholder="In-game name" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Rank</label>
                  <Select value={newRank} onValueChange={setNewRank}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select rank" /></SelectTrigger>
                    <SelectContent>{getRanksForGame(newGame).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Role</label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{getRolesForGame(newGame).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Region</label>
                  <Select value={newRegion} onValueChange={setNewRegion}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>{getRegionsForGame(newGame).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAdding(false); setNewGame(""); }}>Cancel</Button>
            <Button variant="neon" size="sm" className="h-7 text-xs" onClick={handleAddGame} disabled={!newGame || savingNew}>
              {savingNew ? "Adding..." : "Add Game"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
