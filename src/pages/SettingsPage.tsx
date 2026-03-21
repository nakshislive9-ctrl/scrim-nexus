import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Settings as SettingsIcon, User, Bell, Palette, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SettingsPage() {
  const [teamName, setTeamName] = useState("Shadow Collective");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        <StaggerContainer className="space-y-4">
          <StaggerItem>
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-5">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Details</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Primary Game</label>
                  <select className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option>Valorant</option>
                    <option>CS2</option>
                    <option>Overwatch 2</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase block mb-2">Region</label>
                  <select className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option>NA East</option>
                    <option>NA West</option>
                    <option>EU West</option>
                    <option>EU East</option>
                  </select>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-primary tracking-wider uppercase">Notifications</span>
              </div>
              <div className="space-y-4">
                <ToggleRow
                  label="Push Notifications"
                  description="Receive challenge alerts"
                  enabled={notifications}
                  onToggle={() => setNotifications(!notifications)}
                />
                <ToggleRow
                  label="Sound Effects"
                  description="Play ping sound on match found"
                  enabled={soundEnabled}
                  onToggle={() => setSoundEnabled(!soundEnabled)}
                />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="flex justify-end">
              <Button variant="neon">Save Changes</Button>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition-transform ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
