import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Team {
  id: string;
  captain_id: string;
  name: string;
  game: string;
  rank: string;
  region: string | null;
  join_code: string;
  discord_webhook_url: string | null;
  map_pool: Record<string, string | null>;
  reliability_score: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  ign: string;
  role: string | null;
  member_rank: string | null;
  level: string | null;
  is_captain: boolean;
}

export function useTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    if (!user) { setLoading(false); return; }

    const teamCols = "id, captain_id, name, game, rank, region, map_pool, reliability_score";

    let { data: teamData } = await supabase
      .from("teams")
      .select(teamCols)
      .eq("captain_id", user.id)
      .maybeSingle();

    if (!teamData) {
      const { data: memberRow } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberRow) {
        const { data: t } = await supabase
          .from("teams")
          .select(teamCols)
          .eq("id", memberRow.team_id)
          .maybeSingle();
        teamData = t;
      }
    }

    if (teamData) {
      // Fetch sensitive columns via SECURITY DEFINER RPC (members only)
      const { data: secrets } = await supabase.rpc("get_my_team_secrets", { _team_id: teamData.id });
      const s = Array.isArray(secrets) ? secrets[0] : null;

      setTeam({
        ...teamData,
        join_code: s?.join_code ?? "",
        discord_webhook_url: (s?.discord_webhook_url ?? null) as any,
        map_pool: (teamData.map_pool as Record<string, string | null>) ?? {},
      });

      const { data: memberData } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamData.id)
        .order("is_captain", { ascending: false });

      setMembers(memberData ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, [user]);

  return { team, members, loading, refetch: fetchTeam };
}
