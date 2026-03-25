import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Clock, TrendingUp, Activity, Swords, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { format } from "date-fns";

const reliabilityData = [
  { day: "Mon", score: 82 },
  { day: "Tue", score: 85 },
  { day: "Wed", score: 78 },
  { day: "Thu", score: 88 },
  { day: "Fri", score: 91 },
  { day: "Sat", score: 89 },
  { day: "Sun", score: 93 },
];

interface UpcomingScrim {
  id: string;
  scheduled_time: string;
  status: string;
  opponent_name: string;
  opponent_rank: string;
  isHome: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team } = useTeam();
  const [upcomingScrims, setUpcomingScrims] = useState<UpcomingScrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!team) { setLoading(false); return; }

    const fetchScrims = async () => {
      const { data } = await supabase
        .from("scrims")
        .select("*")
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .in("status", ["scheduled"])
        .order("scheduled_time", { ascending: true });

      if (!data || data.length === 0) {
        setUpcomingScrims([]);
        setLoading(false);
        return;
      }

      const opponentIds = data.map((s) =>
        s.home_team_id === team.id ? s.away_team_id : s.home_team_id
      );

      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, rank")
        .in("id", opponentIds);

      const teamsMap = new Map(teamsData?.map((t) => [t.id, t]) ?? []);

      setUpcomingScrims(
        data.map((s) => {
          const isHome = s.home_team_id === team.id;
          const opId = isHome ? s.away_team_id : s.home_team_id;
          const op = teamsMap.get(opId);
          return {
            id: s.id,
            scheduled_time: s.scheduled_time,
            status: s.status,
            opponent_name: op?.name ?? "Unknown",
            opponent_rank: op?.rank ?? "",
            isHome,
          };
        })
      );
      setLoading(false);
    };

    fetchScrims();

    const channel = supabase
      .channel("dashboard_scrims")
      .on("postgres_changes", { event: "*", schema: "public", table: "scrims" }, () => {
        fetchScrims();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [team]);

  const visibleScrims = upcomingScrims.filter((s) => !dismissedIds.has(s.id));
  const nextScrim = visibleScrims[0] ?? null;
  const isExpired = nextScrim ? new Date(nextScrim.scheduled_time) < new Date() : false;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Your competitive overview at a glance</p>
          </div>
          <Button variant="neon" onClick={() => navigate("/find-scrims")}>
            <Crosshair className="h-4 w-4 mr-2" />
            Find Scrim
          </Button>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Next Match Hero Card */}
          <StaggerItem className="md:col-span-2 lg:col-span-2">
            <div className="glass-panel p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Swords className={`h-4 w-4 ${isExpired ? "text-destructive" : "text-primary"}`} />
                  <span className={`text-xs font-mono tracking-wider uppercase ${isExpired ? "text-destructive" : "text-primary"}`}>
                    {isExpired ? "Match Expired" : "Next Match"}
                  </span>
                </div>
                {nextScrim ? (
                  <>
                    {isExpired && (
                      <button
                        onClick={() => handleDismiss(nextScrim.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        aria-label="Dismiss expired match"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isExpired ? "bg-destructive/10" : "bg-primary/10"}`}>
                          <Swords className={`h-6 w-6 ${isExpired ? "text-destructive" : "text-primary"}`} />
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${isExpired ? "text-destructive" : ""}`}>vs {nextScrim.opponent_name}</p>
                          <p className={`text-xs font-mono mt-0.5 ${isExpired ? "text-destructive/60" : "text-muted-foreground"}`}>
                            {nextScrim.opponent_rank}
                          </p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className={`flex items-center gap-2 ${isExpired ? "text-destructive" : "text-primary"}`}>
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-mono">{format(new Date(nextScrim.scheduled_time), "MMM d, yyyy")}</span>
                        </div>
                        <p className={`text-xs font-mono mt-1 ${isExpired ? "text-destructive/60" : "text-muted-foreground"}`}>
                          {format(new Date(nextScrim.scheduled_time), "h:mm a")}
                          {isExpired && " · Expired"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Swords className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No upcoming scrims scheduled</p>
                    <Button size="sm" variant="neon" className="mt-4" onClick={() => navigate("/find-scrims")}>
                      Find a Scrim
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </StaggerItem>

          {/* Reliability Score Card */}
          <StaggerItem>
            <div className="glass-panel p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Reliability</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <ReliabilityRing score={team?.reliability_score ?? 93} size={100} />
                <p className="text-xs text-muted-foreground mt-3">+5% this week</p>
              </div>
            </div>
          </StaggerItem>

          {/* Reliability Trend Chart */}
          <StaggerItem className="md:col-span-2">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Weekly Trend</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reliabilityData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "hsl(215 15% 50%)" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(220 20% 12%)",
                        border: "1px solid hsl(220 15% 18%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "hsl(210 20% 92%)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(185 100% 50%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(185 100% 50%)", r: 3 }}
                      activeDot={{ r: 5, fill: "hsl(185 100% 50%)", stroke: "hsl(185 100% 50% / 0.3)", strokeWidth: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </StaggerItem>

          {/* Upcoming Scrims List */}
          <StaggerItem>
            <div className="glass-panel p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">Upcoming</span>
                </div>
              </div>
              <div className="space-y-3">
                {upcomingScrims.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No scrims scheduled yet</p>
                ) : (
                  upcomingScrims.slice(0, 5).map((scrim) => (
                    <div key={scrim.id} className="flex items-start gap-3 group">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/80 leading-snug">vs {scrim.opponent_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {format(new Date(scrim.scheduled_time), "MMM d · h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

function Crosshair(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

function ReliabilityRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative reliability-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(220 15% 18%)" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(185 100% 50%)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono neon-text">{score}</span>
        <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">Score</span>
      </div>
    </div>
  );
}
