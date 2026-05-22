import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, Swords, Users, Loader2, ArrowLeft } from "lucide-react";
import { GameLogo } from "@/components/GameLogo";

interface Lobby {
  id: string;
  team_a_id: string;
  team_a_captain_id: string;
  team_b_id: string | null;
  team_b_captain_id: string | null;
  game: string;
  status: string;
}

interface TeamLite {
  id: string;
  name: string;
  rank: string;
  region: string | null;
}

export default function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team: myTeam } = useTeam();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [teamA, setTeamA] = useState<TeamLite | null>(null);
  const [teamB, setTeamB] = useState<TeamLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/lobby/${id}`;

  const loadLobby = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("scrim_lobbies").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      setLoading(false);
      return;
    }
    setLobby(data);
    const teamIds = [data.team_a_id, data.team_b_id].filter(Boolean) as string[];
    const { data: teams } = await supabase.from("teams").select("id,name,rank,region").in("id", teamIds);
    setTeamA(teams?.find((t) => t.id === data.team_a_id) ?? null);
    setTeamB(teams?.find((t) => t.id === data.team_b_id) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadLobby();
  }, [id]);

  // Realtime: react instantly when opponent joins or status changes
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`lobby_${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "scrim_lobbies", filter: `id=eq.${id}` }, () => {
        loadLobby();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied", description: "Share with your opponent." });
    setTimeout(() => setCopied(false), 1800);
  };

  const joinAsOpponent = async () => {
    if (!lobby || !myTeam || !user) return;
    if (myTeam.id === lobby.team_a_id) {
      toast({ title: "You're already team A", variant: "destructive" });
      return;
    }
    if (myTeam.game !== lobby.game) {
      toast({ title: "Game mismatch", description: `This lobby is for ${lobby.game}.`, variant: "destructive" });
      return;
    }
    if (myTeam.captain_id !== user.id) {
      toast({ title: "Captains only", description: "Only the team captain can lock the opponent slot.", variant: "destructive" });
      return;
    }
    setJoining(true);
    const { error } = await supabase
      .from("scrim_lobbies")
      .update({ team_b_id: myTeam.id, team_b_captain_id: user.id })
      .eq("id", lobby.id)
      .is("team_b_id", null);
    setJoining(false);
    if (error) {
      toast({ title: "Couldn't join", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Locked in!", description: "Map veto unlocking soon." });
    loadLobby();
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="glass-panel p-10 text-center max-w-md">
          <p className="text-lg font-semibold mb-2">Lobby not found</p>
          <p className="text-sm text-muted-foreground mb-6">This match link is invalid or has been removed.</p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isCaptainOfA = user?.id === lobby.team_a_captain_id;
  const isCaptainOfB = user?.id === lobby.team_b_captain_id;
  const canJoin = !lobby.team_b_id && myTeam && myTeam.id !== lobby.team_a_id && myTeam.captain_id === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => navigate("/dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <GameLogo game={lobby.game} className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Match Lobby</h1>
            <p className="text-xs text-muted-foreground font-mono">{lobby.game} · {lobby.status}</p>
          </div>
          <Badge variant={lobby.status === "waiting" ? "outline" : "default"} className="ml-auto">
            {lobby.status === "waiting" ? "Waiting for opponent" : lobby.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-8">
          <SlotCard label="Team A" team={teamA} filled />
          <div className="hidden md:flex items-center justify-center">
            <div className="rounded-full bg-primary/10 border border-primary/30 p-3">
              <Swords className="h-5 w-5 text-primary" />
            </div>
          </div>
          <SlotCard
            label="Team B"
            team={teamB}
            filled={!!teamB}
            action={
              !lobby.team_b_id ? (
                myTeam ? (
                  <Button onClick={joinAsOpponent} disabled={joining || !canJoin} className="w-full">
                    {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                    Join as Opponent
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Create or join a team to lock this slot.</p>
                )
              ) : null
            }
          />
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-mono text-primary uppercase tracking-wider mb-3">Share Lobby</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm font-mono text-muted-foreground truncate">
              {shareUrl}
            </div>
            <Button variant="outline" size="sm" onClick={copyShare} className="shrink-0 gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Anyone with this link can claim the opponent slot for their team.
          </p>
        </div>

        {lobby.team_b_id && (isCaptainOfA || isCaptainOfB) && (
          <div className="mt-6 glass-panel p-6 text-center border border-primary/30">
            <p className="text-sm text-muted-foreground">Both teams locked in. Map veto interface coming in the next phase.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SlotCard({
  label,
  team,
  filled,
  action,
}: {
  label: string;
  team: TeamLite | null;
  filled: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className={`glass-panel p-6 flex flex-col gap-3 min-h-[180px] ${filled ? "" : "border-dashed"}`}>
      <p className="text-xs font-mono text-primary uppercase tracking-wider">{label}</p>
      {team ? (
        <>
          <h3 className="text-xl font-bold tracking-tight">{team.name}</h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{team.rank}</Badge>
            {team.region && <Badge variant="outline">{team.region}</Badge>}
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic">Slot open</p>
          </div>
          {action}
        </>
      )}
    </div>
  );
}
