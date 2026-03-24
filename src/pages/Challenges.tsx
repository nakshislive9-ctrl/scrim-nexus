import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Swords, Clock, Check, X, Send, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrimRequests, ScrimRequest } from "@/hooks/useScrimRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { format } from "date-fns";

function TimeProposalForm({ onSubmit }: { onSubmit: (time: string) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = () => {
    if (!date || !time) return;
    onSubmit(new Date(`${date}T${time}`).toISOString());
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <Button size="sm" variant="neon" onClick={handleSubmit} disabled={!date || !time}>
        <Send className="h-3.5 w-3.5 mr-1" /> Propose
      </Button>
    </div>
  );
}

function RequestCard({
  request,
  type,
  userId,
  onAccept,
  onDecline,
  onProposeTime,
  onConfirmTime,
  onRejectTime,
}: {
  request: ScrimRequest;
  type: "incoming" | "outgoing";
  userId: string;
  onAccept: () => void;
  onDecline: () => void;
  onProposeTime: (time: string) => void;
  onConfirmTime: () => void;
  onRejectTime: () => void;
}) {
  const [showTimeForm, setShowTimeForm] = useState(false);
  const otherTeam = type === "incoming" ? request.challenger_team : request.challenged_team;
  const isPending = request.status === "pending";
  const isAccepted = request.status === "accepted";
  const timeProposed = request.time_status === "proposed";
  const timeConfirmed = request.time_status === "confirmed";
  const iProposedTime = request.proposed_by === userId;

  return (
    <div className="glass-panel-hover p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Swords className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{otherTeam?.name ?? "Unknown"}</h3>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              {otherTeam?.rank}
            </Badge>
            {isPending && <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">Pending</Badge>}
            {isAccepted && !timeConfirmed && <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Accepted</Badge>}
            {timeConfirmed && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Scheduled</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {otherTeam?.game} · {otherTeam?.region ?? "No region"} · {format(new Date(request.created_at), "MMM d, h:mm a")}
          </p>
        </div>

        {/* Pending incoming: Accept/Decline */}
        {type === "incoming" && isPending && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="neon" onClick={onAccept}>
              <Check className="h-3.5 w-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={onDecline}>
              <X className="h-3.5 w-3.5 mr-1" /> Decline
            </Button>
          </div>
        )}

        {/* Pending outgoing: Waiting */}
        {type === "outgoing" && isPending && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">Waiting for response...</Badge>
        )}
      </div>

      {/* Time scheduling (only after accepted) */}
      {isAccepted && !timeConfirmed && (
        <div className="border-t border-border/50 pt-3">
          {!timeProposed && (
            <>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Propose a time for this scrim
              </p>
              {showTimeForm ? (
                <TimeProposalForm onSubmit={(t) => { onProposeTime(t); setShowTimeForm(false); }} />
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowTimeForm(true)}>
                  <Clock className="h-3.5 w-3.5 mr-1" /> Suggest Time
                </Button>
              )}
            </>
          )}

          {timeProposed && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Proposed time: <span className="text-foreground font-medium">{format(new Date(request.proposed_time!), "MMM d, yyyy · h:mm a")}</span>
                {iProposedTime ? " (by you)" : ""}
              </p>
              {!iProposedTime ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="neon" onClick={onConfirmTime}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Confirm Time
                  </Button>
                  <Button size="sm" variant="outline" onClick={onRejectTime}>
                    <X className="h-3.5 w-3.5 mr-1" /> Suggest Different Time
                  </Button>
                </div>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Waiting for opponent to confirm...</Badge>
              )}
            </div>
          )}
        </div>
      )}

      {timeConfirmed && (
        <div className="border-t border-border/50 pt-3">
          <p className="text-xs text-success flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Scrim scheduled for {format(new Date(request.proposed_time!), "MMM d, yyyy · h:mm a")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Challenges() {
  const { user } = useAuth();
  const { incoming, outgoing, loading, respondToChallenge, proposeTime, confirmTime, rejectTime } = useScrimRequests();

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const allRequests = [
    ...incoming.map((r) => ({ ...r, _type: "incoming" as const })),
    ...outgoing.map((r) => ({ ...r, _type: "outgoing" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage incoming and outgoing scrim requests</p>
        </div>

        {allRequests.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Swords className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active challenges</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Head to Find Scrims to challenge a team</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-3">
            {allRequests.map((r) => (
              <StaggerItem key={r.id}>
                <RequestCard
                  request={r}
                  type={r._type}
                  userId={user?.id ?? ""}
                  onAccept={() => respondToChallenge(r.id, true)}
                  onDecline={() => respondToChallenge(r.id, false)}
                  onProposeTime={(t) => proposeTime(r.id, t)}
                  onConfirmTime={() => confirmTime(r.id)}
                  onRejectTime={() => rejectTime(r.id)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
