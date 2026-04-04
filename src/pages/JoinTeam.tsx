import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { Button } from "@/components/ui/button";
import { Users, Check, AlertCircle, Loader2 } from "lucide-react";

export default function JoinTeam() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, refetch } = useTeam();
  const [status, setStatus] = useState<"loading" | "confirm" | "success" | "error" | "already">("loading");
  const [teamInfo, setTeamInfo] = useState<{ name: string; game: string; rank: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) { setStatus("error"); setError("Invalid invite link."); return; }
    if (team) { setStatus("already"); return; }

    const fetchTeam = async () => {
      const { data } = await supabase
        .from("teams")
        .select("id, name, game, rank, join_code")
        .eq("join_code", code)
        .maybeSingle();

      if (!data) { setStatus("error"); setError("Team not found or invalid invite code."); return; }
      setTeamInfo({ name: data.name, game: data.game, rank: data.rank });
      setStatus("confirm");
    };
    fetchTeam();
  }, [code, team]);

  const handleJoin = async () => {
    if (!code || !user) return;
    setStatus("loading");

    const { data: teamData } = await supabase
      .from("teams")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();

    if (!teamData) { setStatus("error"); setError("Team not found."); return; }

    const { error: insertErr } = await supabase.from("team_members").insert({
      team_id: teamData.id,
      user_id: user.id,
      ign: user.email?.split("@")[0] ?? "Player",
      is_captain: false,
    });

    if (insertErr) {
      setStatus("error");
      setError(insertErr.message);
      return;
    }

    await refetch();
    setStatus("success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
        {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />}

        {status === "confirm" && teamInfo && (
          <>
            <Users className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-xl font-bold">Join {teamInfo.name}?</h1>
            <p className="text-sm text-muted-foreground">{teamInfo.game} · {teamInfo.rank}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="neon" onClick={handleJoin}>Join Team</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <Check className="h-10 w-10 text-success mx-auto" />
            <h1 className="text-xl font-bold">You're in!</h1>
            <p className="text-sm text-muted-foreground">Welcome to the team.</p>
            <Button variant="neon" onClick={() => navigate("/team-profile")}>View Team</Button>
          </>
        )}

        {status === "already" && (
          <>
            <AlertCircle className="h-10 w-10 text-warning mx-auto" />
            <h1 className="text-xl font-bold">Already on a team</h1>
            <p className="text-sm text-muted-foreground">You need to leave your current team first.</p>
            <Button variant="outline" onClick={() => navigate("/team-profile")}>Go to Team</Button>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Go Home</Button>
          </>
        )}
      </div>
    </div>
  );
}
