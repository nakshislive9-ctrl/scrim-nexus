import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Ban, Check, Clock, Loader2, Swords } from "lucide-react";
import { getMapsForGame } from "@/lib/gameData";

interface VetoStep {
  action: "ban" | "pick";
  team: "A" | "B";
  map: string;
  at: string;
}

interface VetoState {
  steps: VetoStep[];
  remaining: string[];
  picked: string[];
}

interface MapVetoProps {
  lobbyId: string;
  status: string;
  game: string;
  teamACaptainId: string;
  teamBCaptainId: string | null;
  teamAName: string;
  teamBName: string;
  vetoState: VetoState;
  currentTurnCaptainId: string | null;
  turnDeadline: string | null;
  onChange: () => void;
}

const TURN_SECONDS = 30;

// Ban (A), Ban (B), Pick (A)
const SEQUENCE: { action: "ban" | "pick"; team: "A" | "B" }[] = [
  { action: "ban", team: "A" },
  { action: "ban", team: "B" },
  { action: "pick", team: "A" },
];

export function MapVeto({
  lobbyId,
  status,
  game,
  teamACaptainId,
  teamBCaptainId,
  teamAName,
  teamBName,
  vetoState,
  currentTurnCaptainId,
  turnDeadline,
  onChange,
}: MapVetoProps) {
  const { user } = useAuth();
  const [working, setWorking] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 1Hz ticker for the timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stepIndex = vetoState.steps.length;
  const isFinished = stepIndex >= SEQUENCE.length || status === "active" || status === "completed";
  const currentStep = isFinished ? null : SEQUENCE[stepIndex];
  const myTeam: "A" | "B" | null =
    user?.id === teamACaptainId ? "A" : user?.id === teamBCaptainId ? "B" : null;
  const isMyTurn = !!currentStep && myTeam === currentStep.team && user?.id === currentTurnCaptainId;

  const secondsLeft = turnDeadline
    ? Math.max(0, Math.ceil((new Date(turnDeadline).getTime() - now) / 1000))
    : TURN_SECONDS;

  // Initialise veto state on first render if the lobby just transitioned and remaining is empty
  useEffect(() => {
    const init = async () => {
      if (!teamBCaptainId) return;
      if (vetoState.remaining.length > 0 || vetoState.steps.length > 0) return;
      if (status !== "waiting" && status !== "veto") return;
      if (user?.id !== teamACaptainId && user?.id !== teamBCaptainId) return;
      const pool = getMapsForGame(game).slice(0, 7);
      if (pool.length === 0) return;
      await supabase
        .from("scrim_lobbies")
        .update({
          status: "veto",
          veto_state: { steps: [], remaining: pool, picked: [] } as any,
          current_turn_captain_id: teamACaptainId,
          turn_deadline: new Date(Date.now() + TURN_SECONDS * 1000).toISOString(),
        })
        .eq("id", lobbyId);
      onChange();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamBCaptainId, status]);

  const advance = async (map: string) => {
    if (!currentStep || !user) return;
    setWorking(true);
    const nextSteps = [
      ...vetoState.steps,
      { action: currentStep.action, team: currentStep.team, map, at: new Date().toISOString() },
    ];
    const nextRemaining = vetoState.remaining.filter((m) => m !== map);
    const nextPicked = currentStep.action === "pick" ? [...vetoState.picked, map] : vetoState.picked;
    const nextIndex = nextSteps.length;
    const done = nextIndex >= SEQUENCE.length;
    const nextTeam = done ? null : SEQUENCE[nextIndex].team;
    const nextCaptain = nextTeam === "A" ? teamACaptainId : nextTeam === "B" ? teamBCaptainId : null;

    const { error } = await supabase
      .from("scrim_lobbies")
      .update({
        veto_state: { steps: nextSteps, remaining: nextRemaining, picked: nextPicked } as any,
        current_turn_captain_id: nextCaptain,
        turn_deadline: done ? null : new Date(Date.now() + TURN_SECONDS * 1000).toISOString(),
        status: done ? "active" : "veto",
      })
      .eq("id", lobbyId);
    setWorking(false);
    if (error) {
      toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
      return;
    }
    onChange();
  };

  // Auto-pick on timeout: the captain whose turn it is auto-bans/picks the first remaining map
  useEffect(() => {
    if (!isMyTurn || isFinished || secondsLeft > 0 || working) return;
    if (vetoState.remaining.length === 0) return;
    advance(vetoState.remaining[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isMyTurn]);

  const turnLabel = useMemo(() => {
    if (isFinished) return "Veto complete";
    if (!currentStep) return "";
    const team = currentStep.team === "A" ? teamAName : teamBName;
    return `${team} to ${currentStep.action}`;
  }, [currentStep, isFinished, teamAName, teamBName]);

  if (!teamBCaptainId) return null;

  const pickedMap = vetoState.picked[0];

  return (
    <div className="glass-panel p-6 border border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-primary tracking-wider uppercase">Map Veto</span>
        </div>
        {!isFinished && (
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={secondsLeft <= 5 ? "text-destructive" : "text-muted-foreground"}>
              {secondsLeft}s
            </span>
          </div>
        )}
      </div>

      <p className="text-sm mb-4">
        <span className="text-muted-foreground">Phase: </span>
        <span className="font-semibold">{turnLabel}</span>
        {isMyTurn && !isFinished && (
          <Badge variant="default" className="ml-2">Your turn</Badge>
        )}
      </p>

      {isFinished && pickedMap ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-6 text-center mb-4 animate-scale-in">
          <p className="text-xs font-mono text-primary uppercase tracking-wider mb-1">Map Selected</p>
          <p className="text-3xl font-bold tracking-tight">{pickedMap}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-5">
          {vetoState.remaining.map((map) => {
            const bannedBy = vetoState.steps.find((s) => s.map === map && s.action === "ban");
            const isBanned = !!bannedBy;
            return (
              <button
                key={map}
                disabled={!isMyTurn || working || isBanned}
                onClick={() => advance(map)}
                className={`relative rounded-lg border px-3 py-4 text-sm font-medium transition-all ${
                  isBanned
                    ? "border-destructive/40 bg-destructive/10 text-muted-foreground line-through"
                    : isMyTurn
                    ? "border-primary/40 bg-card hover:bg-primary/10 hover:border-primary cursor-pointer active:scale-[0.97]"
                    : "border-border/50 bg-card/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {map}
                {isBanned && <Ban className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-destructive" />}
              </button>
            );
          })}
          {vetoState.steps
            .filter((s) => s.action === "ban")
            .map((s) => (
              <div
                key={`banned-${s.map}`}
                className="relative rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-4 text-sm text-muted-foreground line-through text-center"
              >
                {s.map}
                <Ban className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-destructive" />
              </div>
            ))}
        </div>
      )}

      {vetoState.steps.length > 0 && (
        <div className="border-t border-border/40 pt-4">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">History</p>
          <ol className="space-y-1.5 text-sm">
            {vetoState.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                {s.action === "ban" ? (
                  <Ban className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="font-medium">
                  {s.team === "A" ? teamAName : teamBName}
                </span>
                <span className="text-muted-foreground">{s.action === "ban" ? "banned" : "picked"}</span>
                <span className="font-semibold">{s.map}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {working && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Submitting…
        </div>
      )}
    </div>
  );
}
