import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Shield, Trophy, XCircle, CheckCircle, Users, MapPin, Gamepad2, Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeam, TeamMember } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { getRanksForGame, getRolesForGame } from "@/lib/gameData";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function TeamProfile() {
  const { team, members, loading, refetch } = useTeam();
  const [editingRoster, setEditingRoster] = useState(false);
  const [editMembers, setEditMembers] = useState<TeamMember[]>([]);
  const [newMembers, setNewMembers] = useState<{ ign: string; role: string; member_rank: string; level: string }[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!team) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto text-center py-20 space-y-4">
          <h1 className="text-2xl font-bold">No Team Yet</h1>
          <p className="text-muted-foreground">Create your team to get started.</p>
          <Button variant="neon" onClick={() => navigate("/onboarding")}>Create Team</Button>
        </div>
      </PageTransition>
    );
  }

  const score = team.reliability_score;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const startEditing = () => {
    setEditMembers([...members]);
    setNewMembers([]);
    setDeletedIds([]);
    setEditingRoster(true);
  };

  const cancelEditing = () => {
    setEditingRoster(false);
    setEditMembers([]);
    setNewMembers([]);
    setDeletedIds([]);
  };

  const updateExisting = (id: string, field: keyof TeamMember, value: string) => {
    setEditMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const markDelete = (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
    setEditMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const addNewMember = () => {
    setNewMembers((prev) => [...prev, { ign: "", role: "", member_rank: "", level: "" }]);
  };

  const updateNew = (idx: number, field: string, value: string) => {
    setNewMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const removeNew = (idx: number) => {
    setNewMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveRoster = async () => {
    setSaving(true);
    try {
      // Delete removed members
      if (deletedIds.length > 0) {
        const { error } = await supabase.from("team_members").delete().in("id", deletedIds);
        if (error) throw error;
      }

      // Update existing
      for (const m of editMembers) {
        const { error } = await supabase.from("team_members").update({
          ign: m.ign,
          role: m.role,
          member_rank: m.member_rank,
          level: m.level,
        }).eq("id", m.id);
        if (error) throw error;
      }

      // Insert new
      const toInsert = newMembers.filter((m) => m.ign.trim()).map((m) => ({
        team_id: team.id,
        ign: m.ign,
        role: m.role || null,
        member_rank: m.member_rank || null,
        level: m.level || null,
        is_captain: false,
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("team_members").insert(toInsert);
        if (error) throw error;
      }

      toast.success("Roster updated!");
      setEditingRoster(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update roster");
    } finally {
      setSaving(false);
    }
  };

  const ranks = getRanksForGame(team.game);
  const roles = getRolesForGame(team.game);
  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Team Profile</h1>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reliability Ring */}
          <StaggerItem>
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="relative reliability-ring mb-4" style={{ width: 132, height: 132 }}>
                <svg width={132} height={132} className="-rotate-90">
                  <circle cx={66} cy={66} r={radius} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                  <circle cx={66} cy={66} r={radius} stroke="hsl(var(--primary))" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono neon-text">{score}</span>
                  <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">Reliable</span>
                </div>
              </div>
              <h2 className="font-bold text-lg">{team.name}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Gamepad2 className="h-3 w-3" /> {team.game}</span>
                {team.region && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {team.region}</span>}
              </div>
              <Badge variant="outline" className="mt-3 text-[10px] font-mono border-primary/30 text-primary">{team.rank}</Badge>
            </div>
          </StaggerItem>

          {/* Roster */}
          <StaggerItem className="lg:col-span-2">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">Active Roster</span>
                </div>
                {!editingRoster ? (
                  <Button variant="ghost" size="sm" onClick={startEditing}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button variant="neon" size="sm" onClick={saveRoster} disabled={saving}>
                      <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>

              {!editingRoster ? (
                <div className="space-y-2">
                  {members.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${p.is_captain ? "bg-warning" : "bg-muted-foreground/40"}`} />
                        <div>
                          <p className="text-sm font-medium">{p.ign} {p.is_captain && <span className="text-[10px] text-warning font-mono">★ CPT</span>}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{[p.role, p.member_rank, p.level && `Lv.${p.level}`].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>}
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {editMembers.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">{m.is_captain ? "★ Captain" : "Player"}</span>
                        {!m.is_captain && (
                          <button onClick={() => markDelete(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <input type="text" value={m.ign} onChange={(e) => updateExisting(m.id, "ign", e.target.value)} placeholder="IGN"
                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={m.role || ""} onChange={(e) => updateExisting(m.id, "role", e.target.value)} placeholder="Role"
                          className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                        <select value={m.member_rank || ""} onChange={(e) => updateExisting(m.id, "member_rank", e.target.value)}
                          className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">Rank...</option>
                          {ranks.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <input type="text" value={m.level || ""} onChange={(e) => updateExisting(m.id, "level", e.target.value)} placeholder="Level"
                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                    </div>
                  ))}

                  {/* New members */}
                  {newMembers.map((m, idx) => (
                    <div key={`new-${idx}`} className="p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-primary">New Player</span>
                        <button onClick={() => removeNew(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input type="text" value={m.ign} onChange={(e) => updateNew(idx, "ign", e.target.value)} placeholder="IGN"
                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={m.role} onChange={(e) => updateNew(idx, "role", e.target.value)} placeholder="Role"
                          className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                        <select value={m.member_rank} onChange={(e) => updateNew(idx, "member_rank", e.target.value)}
                          className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">Rank...</option>
                          {ranks.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <input type="text" value={m.level} onChange={(e) => updateNew(idx, "level", e.target.value)} placeholder="Level"
                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                    </div>
                  ))}

                  <Button variant="ghost" size="sm" onClick={addNewMember} className="w-full border border-dashed border-border/50">
                    <Plus className="h-4 w-4 mr-1" /> Add Player
                  </Button>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Map Pool */}
          <StaggerItem className="lg:col-span-3">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Map Pool</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(team.map_pool).map(([map, status]) => (
                  <Badge key={map} variant="outline" className={`text-xs font-mono ${
                    status === "strong" ? "border-success/50 text-success" : status === "weak" ? "border-destructive/50 text-destructive" : ""
                  }`}>
                    {map} {status && `· ${status}`}
                  </Badge>
                ))}
                {Object.keys(team.map_pool).length === 0 && <p className="text-sm text-muted-foreground">No maps configured</p>}
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
