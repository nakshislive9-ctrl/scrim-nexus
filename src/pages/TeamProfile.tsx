import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Shield, Trophy, XCircle, CheckCircle, Users, MapPin, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const matchHistory = [
  { id: 1, opponent: "Team Phantom", result: "Completed", date: "Mar 18", map: "Ascent", score: "13-9" },
  { id: 2, opponent: "Eclipse Gaming", result: "Forfeited", date: "Mar 15", map: "Haven", score: "—" },
  { id: 3, opponent: "Arctic Storm", result: "Completed", date: "Mar 12", map: "Bind", score: "13-11" },
  { id: 4, opponent: "Crimson Tigers", result: "Completed", date: "Mar 10", map: "Split", score: "13-7" },
  { id: 5, opponent: "Midnight Wolves", result: "Completed", date: "Mar 8", map: "Icebox", score: "11-13" },
];

const roster = [
  { name: "Captain Vex", role: "IGL / Duelist", status: "online" },
  { name: "ShadowK", role: "Controller", status: "online" },
  { name: "Nyx", role: "Sentinel", status: "offline" },
  { name: "Blitz", role: "Initiator", status: "online" },
  { name: "Frost", role: "Flex", status: "away" },
];

export default function TeamProfile() {
  const score = 93;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Team Profile</h1>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reliability Ring */}
          <StaggerItem>
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="relative reliability-ring mb-4" style={{ width: 132, height: 132 }}>
                <svg width={132} height={132} className="-rotate-90">
                  <circle cx={66} cy={66} r={radius} stroke="hsl(220 15% 18%)" strokeWidth="8" fill="none" />
                  <circle cx={66} cy={66} r={radius} stroke="hsl(185 100% 50%)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono neon-text">{score}</span>
                  <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">Reliable</span>
                </div>
              </div>
              <h2 className="font-bold text-lg">Shadow Collective</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Gamepad2 className="h-3 w-3" /> Valorant</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> NA East</span>
              </div>
              <Badge variant="outline" className="mt-3 text-[10px] font-mono border-primary/30 text-primary">Immortal</Badge>
            </div>
          </StaggerItem>

          {/* Roster */}
          <StaggerItem className="lg:col-span-2">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Active Roster</span>
              </div>
              <div className="space-y-2">
                {roster.map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${p.status === "online" ? "bg-success" : p.status === "away" ? "bg-warning" : "bg-muted-foreground/40"}`} />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground capitalize">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Match History */}
          <StaggerItem className="lg:col-span-3">
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Match History</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Opponent</th>
                      <th className="text-left py-2 text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Map</th>
                      <th className="text-left py-2 text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Score</th>
                      <th className="text-left py-2 text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Status</th>
                      <th className="text-right py-2 text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchHistory.map((m) => (
                      <tr key={m.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-3 font-medium">{m.opponent}</td>
                        <td className="py-3 text-muted-foreground">{m.map}</td>
                        <td className="py-3 font-mono">{m.score}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.result === "Completed" ? "text-success" : "text-destructive"}`}>
                            {m.result === "Completed" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {m.result}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground text-xs font-mono">{m.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
