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

    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("captain_id", user.id)
      .maybeSingle();

    if (teamData) {
      setTeam({
        ...teamData,
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
