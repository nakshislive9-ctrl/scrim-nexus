import { PageTransition } from "@/components/PageTransition";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Copy, Check, Gamepad2, Map, Link2, Users, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GAMES, getRanksForGame, getMapsForGame, getRegionsForGame, getRolesForGame } from "@/lib/gameData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type MapStatus = "strong" | "weak" | null;

interface MemberInput {
  ign: string;
  role: string;
  member_rank: string;
  level: string;
}

const emptyMember = (): MemberInput => ({ ign: "", role: "", member_rank: "", level: "" });

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [game, setGame] = useState("");
  const [rank, setRank] = useState("");
  const [region, setRegion] = useState("");
  const [mapPool, setMapPool] = useState<Record<string, MapStatus>>({});
  const [members, setMembers] = useState<MemberInput[]>([emptyMember(), emptyMember(), emptyMember(), emptyMember()]);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const joinLink = joinCode ? `${window.location.origin}/join/${joinCode}` : "";

  const toggleMap = (map: string) => {
    setMapPool((prev) => {
      const current = prev[map];
      if (!current) return { ...prev, [map]: "strong" };
      if (current === "strong") return { ...prev, [map]: "weak" };
      return { ...prev, [map]: null };
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateMember = (idx: number, field: keyof MemberInput, value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMember = () => {
    if (members.length < 9) setMembers((prev) => [...prev, emptyMember()]);
  };

  const removeMember = (idx: number) => {
    if (members.length > 1) setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Create team
      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .insert({
          captain_id: user.id,
          name: teamName,
          game,
          rank,
          region: region || null,
          map_pool: mapPool,
        })
        .select()
        .single();

      if (teamErr) throw teamErr;

      // Add captain as a member
      const captainName = user.user_metadata?.display_name || user.email || "Captain";
      const allMembers = [
        { team_id: team.id, ign: captainName, role: "Captain / IGL", member_rank: rank, level: "", is_captain: true },
        ...members.filter((m) => m.ign.trim()).map((m) => ({
          team_id: team.id,
          ign: m.ign,
          role: m.role || null,
          member_rank: m.member_rank || null,
          level: m.level || null,
          is_captain: false,
        })),
      ];

      const { error: memberErr } = await supabase.from("team_members").insert(allMembers);
      if (memberErr) throw memberErr;

      setJoinCode(team.join_code);
      setStep(3);
      toast.success("Team created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { icon: Gamepad2, title: "Team Setup" },
    { icon: Map, title: "Map Pool" },
    { icon: Users, title: "Roster" },
    { icon: Link2, title: "Invite" },
  ];

  const canProceedStep0 = teamName.trim() && game && rank;
  const canProceedStep2 = members.some((m) => m.ign.trim());

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to <span className="neon-text">ScrimHQ</span></h1>
          <p className="text-sm text-muted-foreground mt-2">Set up your team in {steps.length} quick steps</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                i === step ? "bg-primary text-primary-foreground neon-glow" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 transition-colors ${i < step ? "bg-primary/40" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-panel p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Details</span>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Team Name</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name..."
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Primary Game</label>
                <select value={game} onChange={(e) => { setGame(e.target.value); setRank(""); setRegion(""); setMapPool({}); }}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select game...</option>
                  {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Rank</label>
                <select value={rank} onChange={(e) => setRank(e.target.value)} disabled={!game}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">{game ? "Select rank..." : "Select a game first..."}</option>
                  {getRanksForGame(game).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={!game}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Select region (optional)...</option>
                  {getRegionsForGame(game).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Map Pool</span>
              </div>
              <p className="text-sm text-muted-foreground">Click to cycle: <span className="text-foreground">Neutral</span> → <span className="text-success">Strong</span> → <span className="text-destructive">Weak</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {!game && <p className="col-span-full text-sm text-muted-foreground text-center py-4">Select a game first</p>}
                {getMapsForGame(game).map((map) => {
                  const status = mapPool[map];
                  return (
                    <button key={map} onClick={() => toggleMap(map)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all active:scale-[0.97] ${
                        status === "strong" ? "border-success/50 bg-success/10 text-success"
                        : status === "weak" ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50"
                      }`}>
                      {map}
                      {status && <span className="block text-[10px] font-mono mt-1 tracking-wider uppercase">{status}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Roster</span>
                </div>
                <span className="text-xs text-muted-foreground">{members.length} players</span>
              </div>
              <p className="text-sm text-muted-foreground">Add your teammates. You'll be added as captain automatically.</p>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {members.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">Player {idx + 1}</span>
                      {members.length > 1 && (
                        <button onClick={() => removeMember(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input type="text" value={m.ign} onChange={(e) => updateMember(idx, "ign", e.target.value)} placeholder="In-Game Name (IGN)"
                      className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={m.role} onChange={(e) => updateMember(idx, "role", e.target.value)} placeholder="Role (e.g. Duelist)"
                        className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                      <select value={m.member_rank} onChange={(e) => updateMember(idx, "member_rank", e.target.value)}
                        className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Rank...</option>
                        {getRanksForGame(game).map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <input type="text" value={m.level} onChange={(e) => updateMember(idx, "level", e.target.value)} placeholder="Level (optional, e.g. 142)"
                      className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                ))}
              </div>

              {members.length < 9 && (
                <Button variant="ghost" size="sm" onClick={addMember} className="w-full border border-dashed border-border/50">
                  <Plus className="h-4 w-4 mr-1" /> Add Player
                </Button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Created!</span>
              </div>
              <p className="text-sm text-muted-foreground">Share this link with your players to join the roster</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <code className="flex-1 text-xs font-mono text-foreground truncate">{joinLink}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="neon" className="mt-4" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 2 && (
              <Button variant="neon" onClick={() => setStep(step + 1)}
                disabled={step === 0 && !canProceedStep0}>
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button variant="neon" onClick={handleFinish} disabled={!canProceedStep2 || saving}>
                {saving ? "Creating..." : "Create Team"} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
