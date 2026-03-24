import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "./useTeam";

export interface ScrimRequest {
  id: string;
  challenger_team_id: string;
  challenged_team_id: string;
  challenger_captain_id: string;
  challenged_captain_id: string;
  status: string;
  proposed_time: string | null;
  proposed_by: string | null;
  time_status: string;
  message: string | null;
  created_at: string;
  challenger_team?: { name: string; game: string; rank: string; region: string | null };
  challenged_team?: { name: string; game: string; rank: string; region: string | null };
}

export function useScrimRequests() {
  const { user } = useAuth();
  const { team } = useTeam();
  const [incoming, setIncoming] = useState<ScrimRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ScrimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: inData } = await supabase
      .from("scrim_requests")
      .select("*")
      .eq("challenged_captain_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    const { data: outData } = await supabase
      .from("scrim_requests")
      .select("*")
      .eq("challenger_captain_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    // Fetch team names for all requests
    const allTeamIds = new Set<string>();
    [...(inData ?? []), ...(outData ?? [])].forEach((r) => {
      allTeamIds.add(r.challenger_team_id);
      allTeamIds.add(r.challenged_team_id);
    });

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name, game, rank, region")
      .in("id", Array.from(allTeamIds));

    const teamsMap = new Map(teamsData?.map((t) => [t.id, t]) ?? []);

    const enrich = (r: any): ScrimRequest => ({
      ...r,
      challenger_team: teamsMap.get(r.challenger_team_id),
      challenged_team: teamsMap.get(r.challenged_team_id),
    });

    setIncoming((inData ?? []).map(enrich));
    setOutgoing((outData ?? []).map(enrich));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("scrim_requests_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "scrim_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRequests]);

  const sendChallenge = async (challengedTeamId: string, challengedCaptainId: string) => {
    if (!user || !team) return { error: "No team found" };
    const { error } = await supabase.from("scrim_requests").insert({
      challenger_team_id: team.id,
      challenged_team_id: challengedTeamId,
      challenger_captain_id: user.id,
      challenged_captain_id: challengedCaptainId,
    });
    if (!error) fetchRequests();
    return { error: error?.message ?? null };
  };

  const respondToChallenge = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from("scrim_requests")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", requestId);
    if (!error) fetchRequests();
    return { error: error?.message ?? null };
  };

  const proposeTime = async (requestId: string, time: string) => {
    if (!user) return;
    await supabase
      .from("scrim_requests")
      .update({ proposed_time: time, proposed_by: user.id, time_status: "proposed" })
      .eq("id", requestId);
    fetchRequests();
  };

  const confirmTime = async (requestId: string) => {
    const request = [...incoming, ...outgoing].find((r) => r.id === requestId);
    if (!request || !request.proposed_time) return;

    await supabase
      .from("scrim_requests")
      .update({ time_status: "confirmed" })
      .eq("id", requestId);

    await supabase.from("scrims").insert({
      request_id: requestId,
      home_team_id: request.challenger_team_id,
      away_team_id: request.challenged_team_id,
      scheduled_time: request.proposed_time,
    });

    fetchRequests();
  };

  const rejectTime = async (requestId: string) => {
    await supabase
      .from("scrim_requests")
      .update({ proposed_time: null, proposed_by: null, time_status: "no_proposal" })
      .eq("id", requestId);
    fetchRequests();
  };

  return { incoming, outgoing, loading, sendChallenge, respondToChallenge, proposeTime, confirmTime, rejectTime, refetch: fetchRequests };
}
