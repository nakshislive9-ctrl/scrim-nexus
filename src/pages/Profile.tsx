import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { GAMES, getRolesForGame, getRanksForGame, getRegionsForGame } from "@/lib/gameData";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Shield, Gamepad2, MapPin, Save, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileData {
  display_name: string;
  avatar_url: string | null;
}

interface MemberData {
  id: string;
  ign: string;
  role: string | null;
  member_rank: string | null;
  level: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { team, members, refetch } = useTeam();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myMember, setMyMember] = useState<MemberData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState("");
  const [ign, setIgn] = useState("");
  const [role, setRole] = useState("");
  const [rank, setRank] = useState("");
  const [level, setLevel] = useState("");
  const [teamName, setTeamName] = useState("");
  const [game, setGame] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !members.length) return;
    const me = members.find((m) => m.user_id === user.id);
    if (me) setMyMember(me);
  }, [user, members]);

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? "");
    if (myMember) {
      setIgn(myMember.ign ?? "");
      setRole(myMember.role ?? "");
      setRank(myMember.member_rank ?? "");
      setLevel(myMember.level ?? "");
    }
    if (team) {
      setTeamName(team.name);
      setGame(team.game);
      setRegion(team.region ?? "");
    }
  }, [profile, myMember, team]);

  const editGame = game || team?.game || "";
  const roles = getRolesForGame(editGame);
  const ranks = getRanksForGame(editGame);
  const regions = getRegionsForGame(editGame);
  const isCaptain = team?.captain_id === user?.id;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      // Update team details if captain
      if (team && isCaptain) {
        const { error: teamError } = await supabase
          .from("teams")
          .update({ name: teamName.trim(), game, region: region || null })
          .eq("id", team.id);
        if (teamError) throw teamError;
      }

      if (myMember) {
        const { error: memberError } = await supabase
          .from("team_members")
          .update({
            ign: ign.trim(),
            role: role || null,
            member_rank: rank || null,
            level: level.trim() || null,
          })
          .eq("id", myMember.id);
        if (memberError) throw memberError;
      }

      setProfile((p) => p ? { ...p, display_name: displayName.trim() } : p);
      if (myMember) {
        setMyMember({ ...myMember, ign: ign.trim(), role: role || null, member_rank: rank || null, level: level.trim() || null });
      }
      await refetch();
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setDisplayName(profile.display_name ?? "");
    if (myMember) {
      setIgn(myMember.ign ?? "");
      setRole(myMember.role ?? "");
      setRank(myMember.member_rank ?? "");
      setLevel(myMember.level ?? "");
    }
    if (team) {
      setTeamName(team.name);
      setGame(team.game);
      setRegion(team.region ?? "");
    }
    setEditing(false);
  };

  const initials = (displayName || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your identity and in-game details</p>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="neon" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2"><Save className="h-4 w-4 animate-pulse" /> Saving...</span>
                ) : (
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Save</span>
                )}
              </Button>
            </div>
          )}
        </div>

        <StaggerContainer className="space-y-4">
          {/* Avatar & Identity Card */}
          <StaggerItem>
            <div className="glass-panel p-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold font-mono text-primary shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Display Name</label>
                    {editing ? (
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-9" maxLength={50} />
                    ) : (
                      <p className="text-foreground font-medium truncate">{displayName || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Email</label>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Game Details Card */}
          {team && (
            <StaggerItem>
              <div className="glass-panel p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">Game Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Game */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Game</label>
                    {editing && isCaptain ? (
                      <Select value={game} onValueChange={(v) => { setGame(v); setRank(""); setRole(""); setRegion(""); }}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select game" /></SelectTrigger>
                        <SelectContent>
                          {GAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium mt-1">{team.game}</p>
                    )}
                  </div>

                  {/* Team Name */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Team</label>
                    {editing && isCaptain ? (
                      <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="mt-1 h-9" maxLength={30} />
                    ) : (
                      <p className="text-sm font-medium mt-1">{team.name}</p>
                    )}
                  </div>

                  {/* Region */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Region</label>
                    {editing && isCaptain ? (
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select region" /></SelectTrigger>
                        <SelectContent>
                          {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium mt-1">{team.region || "—"}</p>
                    )}
                  </div>

                  {/* IGN */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">In-Game Name</label>
                    {editing ? (
                      <Input value={ign} onChange={(e) => setIgn(e.target.value)} className="mt-1 h-9" maxLength={30} />
                    ) : (
                      <p className="text-sm font-medium mt-1">{myMember?.ign || "—"}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Role</label>
                    {editing ? (
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium mt-1">{myMember?.role || "—"}</p>
                    )}
                  </div>

                  {/* Rank */}
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Rank</label>
                    {editing ? (
                      <Select value={rank} onValueChange={setRank}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select rank" /></SelectTrigger>
                        <SelectContent>
                          {ranks.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium mt-1">{myMember?.member_rank || "—"}</p>
                    )}
                  </div>

                  {/* Level */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Level / Experience</label>
                    {editing ? (
                      <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Level 250, 2000 hours" className="mt-1 h-9" maxLength={50} />
                    ) : (
                      <p className="text-sm font-medium mt-1">{myMember?.level || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* Team Stats Card */}
          {team && (
            <StaggerItem>
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Stats</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Team Rank</label>
                    <p className="text-sm font-medium mt-1">{team.rank}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Reliability</label>
                    <p className="text-sm font-medium mt-1">{team.reliability_score ?? 100}%</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Captain</label>
                    <p className="text-sm font-medium mt-1">{team.captain_id === user?.id ? "You" : "—"}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {!team && (
            <StaggerItem>
              <div className="glass-panel p-8 text-center">
                <User className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">You're not part of a team yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Complete onboarding to set up your team and game details.</p>
              </div>
            </StaggerItem>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
