import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "@/hooks/useTeam";
import { format } from "date-fns";
import { Trophy, Minus, X as XIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchResult {
  id: string;
  scrim_id: string;
  winner_team_id: string | null;
  home_score: number;
  away_score: number;
  is_draw: boolean;
  mvp_player: string | null;
  notes: string | null;
  created_at: string;
  scheduled_time: string;
  opponent_name: string;
  isHome: boolean;
}

export function MatchHistory() {
  const { team } = useTeam();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!team) { setLoading(false); return; }

    const fetch = async () => {
      // Get completed scrims
      const { data: scrims } = await supabase
        .from("scrims")
        .select("id, home_team_id, away_team_id, scheduled_time, status")
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .eq("status", "completed")
        .order("scheduled_time", { ascending: false });

      if (!scrims?.length) { setResults([]); setLoading(false); return; }

      const scrimIds = scrims.map((s) => s.id);
      const { data: matchResults } = await supabase
        .from("match_results")
        .select("*")
        .in("scrim_id", scrimIds);

      const opponentIds = scrims.map((s) =>
        s.home_team_id === team.id ? s.away_team_id : s.home_team_id
      );
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", [...new Set(opponentIds)]);

      const teamMap = new Map(teams?.map((t) => [t.id, t.name]) ?? []);
      const resultMap = new Map(matchResults?.map((r) => [r.scrim_id, r]) ?? []);

      setResults(
        scrims.map((s) => {
          const isHome = s.home_team_id === team.id;
          const opId = isHome ? s.away_team_id : s.home_team_id;
          const result = resultMap.get(s.id);
          return {
            id: result?.id ?? s.id,
            scrim_id: s.id,
            winner_team_id: result?.winner_team_id ?? null,
            home_score: result?.home_score ?? 0,
            away_score: result?.away_score ?? 0,
            is_draw: result?.is_draw ?? false,
            mvp_player: result?.mvp_player ?? null,
            notes: result?.notes ?? null,
            created_at: result?.created_at ?? s.scheduled_time,
            scheduled_time: s.scheduled_time,
            opponent_name: teamMap.get(opId) ?? "Unknown",
            isHome,
          };
        })
      );
      setLoading(false);
    };

    fetch();
  }, [team]);

  if (loading) return null;

  const wins = results.filter((r) => r.winner_team_id === team?.id).length;
  const losses = results.filter((r) => r.winner_team_id && r.winner_team_id !== team?.id).length;
  const draws = results.filter((r) => r.is_draw).length;
  const noResult = results.filter((r) => !r.winner_team_id && !r.is_draw).length;

  const displayResults = expanded ? results : results.slice(0, 5);

  const getOutcome = (r: MatchResult) => {
    if (r.is_draw) return { label: "Draw", color: "text-warning", icon: Minus };
    if (!r.winner_team_id) return { label: "No Result", color: "text-muted-foreground", icon: Minus };
    if (r.winner_team_id === team?.id) return { label: "Win", color: "text-success", icon: Trophy };
    return { label: "Loss", color: "text-destructive", icon: XIcon };
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono text-primary tracking-wider uppercase">Match History</span>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-bold font-mono text-success">{wins}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Wins</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-bold font-mono text-destructive">{losses}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Losses</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-bold font-mono text-warning">{draws}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Draws</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-bold font-mono text-foreground">{results.length}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">Total</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-6">
          <Trophy className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No completed matches yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Complete your first scrim to see results here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayResults.map((r) => {
            const outcome = getOutcome(r);
            const OutcomeIcon = outcome.icon;
            return (
              <div key={r.scrim_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <OutcomeIcon className={`h-4 w-4 shrink-0 ${outcome.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">vs {r.opponent_name}</span>
                    <span className={`text-xs font-mono font-semibold ${outcome.color}`}>
                      {r.home_score}-{r.away_score}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {format(new Date(r.scheduled_time), "MMM d, yyyy")}
                    {r.mvp_player && ` · MVP: ${r.mvp_player}`}
                  </p>
                </div>
                <span className={`text-[10px] font-mono font-semibold uppercase ${outcome.color}`}>
                  {outcome.label}
                </span>
              </div>
            );
          })}

          {results.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" /> Show Less</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" /> Show All ({results.length})</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
