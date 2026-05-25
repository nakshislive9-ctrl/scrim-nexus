import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Check, Loader2, Trophy, Upload } from "lucide-react";

interface MatchResultProps {
  lobbyId: string;
  status: string;
  teamAId: string;
  teamBId: string;
  teamACaptainId: string;
  teamBCaptainId: string;
  teamAName: string;
  teamBName: string;
  pickedMap: string | null;
  onChange: () => void;
}

interface ResultRow {
  id: string;
  lobby_id: string;
  team_id: string;
  submitted_by: string;
  team_side: "A" | "B";
  map: string | null;
  team_a_score: number;
  team_b_score: number;
  screenshot_url: string | null;
}

export function MatchResult({
  lobbyId,
  status,
  teamAId,
  teamBId,
  teamACaptainId,
  teamBCaptainId,
  teamAName,
  teamBName,
  pickedMap,
  onChange,
}: MatchResultProps) {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mySide: "A" | "B" | null =
    user?.id === teamACaptainId ? "A" : user?.id === teamBCaptainId ? "B" : null;
  const myResult = results.find((r) => r.submitted_by === user?.id);
  const otherResult = results.find((r) => r.submitted_by !== user?.id);

  const load = async () => {
    const { data } = await supabase
      .from("lobby_results")
      .select("*")
      .eq("lobby_id", lobbyId);
    setResults((data as ResultRow[]) ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`lobby_results_${lobbyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lobby_results", filter: `lobby_id=eq.${lobbyId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  useEffect(() => {
    if (myResult) {
      setScoreA(String(myResult.team_a_score));
      setScoreB(String(myResult.team_b_score));
      setScreenshotUrl(myResult.screenshot_url);
    }
  }, [myResult?.id]);

  const isDisputed =
    results.length === 2 &&
    (results[0].team_a_score !== results[1].team_a_score ||
      results[0].team_b_score !== results[1].team_b_score);
  const isMatched =
    results.length === 2 &&
    results[0].team_a_score === results[1].team_a_score &&
    results[0].team_b_score === results[1].team_b_score;

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${lobbyId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("match-screenshots").upload(path, file, {
      upsert: true,
    });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("match-screenshots").getPublicUrl(path);
    setScreenshotUrl(data.publicUrl);
    setUploading(false);
    toast({ title: "Screenshot uploaded" });
  };

  const submit = async () => {
    if (!user || !mySide) return;
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      toast({ title: "Enter valid scores", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const teamId = mySide === "A" ? teamAId : teamBId;
    const payload = {
      lobby_id: lobbyId,
      team_id: teamId,
      submitted_by: user.id,
      team_side: mySide,
      map: pickedMap,
      team_a_score: a,
      team_b_score: b,
      screenshot_url: screenshotUrl,
    };

    let error;
    if (myResult) {
      ({ error } = await supabase
        .from("lobby_results")
        .update(payload)
        .eq("id", myResult.id));
    } else {
      ({ error } = await supabase.from("lobby_results").insert(payload));
    }

    if (error) {
      setSubmitting(false);
      toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
      return;
    }

    // After insert/update, check if both captains agree → finalize lobby
    const { data: latest } = await supabase
      .from("lobby_results")
      .select("*")
      .eq("lobby_id", lobbyId);

    const rows = (latest as ResultRow[]) ?? [];
    if (rows.length === 2) {
      const [r1, r2] = rows;
      const match = r1.team_a_score === r2.team_a_score && r1.team_b_score === r2.team_b_score;
      await supabase
        .from("scrim_lobbies")
        .update({
          status: match ? "completed" : "disputed",
          final_team_a_score: match ? r1.team_a_score : null,
          final_team_b_score: match ? r1.team_b_score : null,
          final_screenshot_url: match ? (r1.screenshot_url ?? r2.screenshot_url) : null,
        })
        .eq("id", lobbyId);
    }

    setSubmitting(false);
    toast({ title: "Result submitted" });
    onChange();
    load();
  };

  if (status !== "active" && status !== "completed" && status !== "disputed") return null;
  if (!mySide && status === "active") {
    return (
      <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
        Waiting for captains to submit the final score…
      </div>
    );
  }

  const winner =
    status === "completed"
      ? results[0]?.team_a_score > results[0]?.team_b_score
        ? teamAName
        : results[0]?.team_b_score > results[0]?.team_a_score
        ? teamBName
        : "Draw"
      : null;

  return (
    <div className="space-y-4">
      {status === "disputed" && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Score Dispute</p>
            <p className="text-sm text-muted-foreground">
              Captains submitted different scores. Re-submit with proof to resolve.
            </p>
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="rounded-lg border-2 border-primary bg-primary/10 p-4 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">Match Confirmed</p>
            <p className="text-sm text-muted-foreground">
              Winner: <span className="font-semibold text-foreground">{winner}</span> ·{" "}
              {results[0]?.team_a_score}–{results[0]?.team_b_score}
            </p>
          </div>
        </div>
      )}

      {mySide && status !== "completed" && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono text-primary uppercase tracking-wider">
                Submit Result
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You're submitting as <span className="font-semibold text-foreground">
                  {mySide === "A" ? teamAName : teamBName}
                </span>
                {pickedMap && <> · Map: <span className="font-semibold text-foreground">{pickedMap}</span></>}
              </p>
            </div>
            {myResult && <Badge variant="outline" className="gap-1"><Check className="h-3 w-3" /> Submitted</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">{teamAName} score</Label>
              <Input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="mt-1 font-mono text-lg tabular-nums"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{teamBName} score</Label>
              <Input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="mt-1 font-mono text-lg tabular-nums"
              />
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Screenshot (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <div className="mt-1 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {screenshotUrl ? "Replace" : "Upload"}
              </Button>
              {screenshotUrl && (
                <a
                  href={screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                >
                  View screenshot
                </a>
              )}
            </div>
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {myResult ? "Update Submission" : "Submit Result"}
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-panel p-5">
          <p className="text-xs font-mono text-primary uppercase tracking-wider mb-3">
            Submissions ({results.length}/2)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { side: "A" as const, name: teamAName, capId: teamACaptainId },
              { side: "B" as const, name: teamBName, capId: teamBCaptainId },
            ].map(({ side, name, capId }) => {
              const r = results.find((x) => x.submitted_by === capId);
              return (
                <div
                  key={side}
                  className={`rounded-lg border p-3 ${
                    r ? "border-primary/30 bg-card" : "border-dashed border-border/50 bg-card/40"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">{name}</p>
                  {r ? (
                    <p className="font-mono text-lg tabular-nums font-semibold">
                      {r.team_a_score} – {r.team_b_score}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Pending…</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
