import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Copy, Check, Gamepad2, Map, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GAMES, getRanksForGame, getMapsForGame } from "@/lib/gameData";

type MapStatus = "strong" | "weak" | null;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [game, setGame] = useState("");
  const [rank, setRank] = useState("");
  const [mapPool, setMapPool] = useState<Record<string, MapStatus>>({});
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const joinId = "scrim-" + Math.random().toString(36).substring(2, 8);
  const joinLink = `${window.location.origin}/join/${joinId}`;

  const toggleMap = (map: string) => {
    setMapPool((prev) => {
      const current = prev[map];
      if (!current) return { ...prev, [map]: "strong" };
      if (current === "strong") return { ...prev, [map]: "weak" };
      return { ...prev, [map]: null };
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      icon: Gamepad2,
      title: "Team Setup",
      description: "Enter your team information",
    },
    {
      icon: Map,
      title: "Map Pool",
      description: "Configure your map preferences",
    },
    {
      icon: Link2,
      title: "Invite Players",
      description: "Share your join link",
    },
  ];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to <span className="neon-text">ScrimHQ</span></h1>
          <p className="text-sm text-muted-foreground mt-2">Set up your team in 3 quick steps</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                i === step ? "bg-primary text-primary-foreground neon-glow" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 transition-colors ${i < step ? "bg-primary/40" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-panel p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Details</span>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name..."
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Primary Game</label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select game...</option>
                  {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Rank</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={!game}
                >
                  <option value="">{game ? "Select rank..." : "Select a game first..."}</option>
                  {getRanksForGame(game).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Map className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Map Pool</span>
              </div>
              <p className="text-sm text-muted-foreground">Click to cycle: <span className="text-foreground">Neutral</span> → <span className="text-success">Strong</span> → <span className="text-destructive">Weak</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MAPS.map((map) => {
                  const status = mapPool[map];
                  return (
                    <button
                      key={map}
                      onClick={() => toggleMap(map)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all active:scale-[0.97] ${
                        status === "strong"
                          ? "border-success/50 bg-success/10 text-success"
                          : status === "weak"
                          ? "border-destructive/50 bg-destructive/10 text-destructive"
                          : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {map}
                      {status && (
                        <span className="block text-[10px] font-mono mt-1 tracking-wider uppercase">{status}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Invite Link</span>
              </div>
              <p className="text-sm text-muted-foreground">Share this link with your 5 players to join the roster</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <code className="flex-1 text-xs font-mono text-foreground truncate">{joinLink}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="neon" className="mt-4" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 2 && (
          <div className="flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              variant="neon"
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && (!teamName || !game || !rank)}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
