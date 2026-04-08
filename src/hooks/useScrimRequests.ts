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

// A request is expired if:
// - pending and older than 48 hours
// - accepted with no time proposal and older than 7 days
// - accepted with confirmed time that has passed
function isRequestExpired(r: ScrimRequest): boolean {
  const now = Date.now();
  const created = new Date(r.created_at).getTime();
  const TWO_DAYS = 48 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  if (r.status === "pending" && now - created > TWO_DAYS) return true;
  if (r.status === "accepted" && r.time_status === "no_proposal" && now - created > SEVEN_DAYS) return true;
  if (r.status === "accepted" && r.time_status === "confirmed" && r.proposed_time && new Date(r.proposed_time).getTime() < now) return true;
  return false;
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

    const allIncoming = (inData ?? []).map(enrich);
    const allOutgoing = (outData ?? []).map(enrich);

    // Filter out expired requests from active views
    setIncoming(allIncoming.filter(r => !isRequestExpired(r)));
    setOutgoing(allOutgoing.filter(r => !isRequestExpired(r)));
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
    if (!error) {
      // Notify the challenged captain
      await supabase.from("notifications").insert({
        user_id: challengedCaptainId,
        type: "challenge",
        title: `${team.name} challenged your team!`,
        message: "Check the Challenges page to accept or decline.",
        link: "/challenges",
      });
      fetchRequests();
    }
    return { error: error?.message ?? null };
  };

  const respondToChallenge = async (requestId: string, accept: boolean) => {
    const request = incoming.find((r) => r.id === requestId);
    const { error } = await supabase
      .from("scrim_requests")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", requestId);
    if (!error) {
      // Notify the challenger captain
      if (request) {
        await supabase.from("notifications").insert({
          user_id: request.challenger_captain_id,
          type: accept ? "accepted" : "declined",
          title: accept
            ? `${request.challenged_team?.name ?? "A team"} accepted your challenge!`
            : `${request.challenged_team?.name ?? "A team"} declined your challenge.`,
          message: accept ? "Propose a time to schedule the match." : undefined,
          link: "/challenges",
        });
      }
      fetchRequests();
    }
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

    // Notify both captains about scheduled match
    const otherCaptain = user?.id === request.challenger_captain_id
      ? request.challenged_captain_id
      : request.challenger_captain_id;
    await supabase.from("notifications").insert({
      user_id: otherCaptain,
      type: "match",
      title: "Match scheduled!",
      message: `Your scrim has been confirmed. Check the dashboard for details.`,
      link: "/",
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
