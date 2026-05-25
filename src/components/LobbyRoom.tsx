import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Circle, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface RosterPlayer {
  user_id: string;
  ign: string;
  role: string | null;
  is_captain: boolean | null;
}

interface LobbyMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  lobbyId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
}

export function LobbyRoom({ lobbyId, teamAId, teamBId, teamAName, teamBName }: Props) {
  const { user } = useAuth();
  const [rosterA, setRosterA] = useState<RosterPlayer[]>([]);
  const [rosterB, setRosterB] = useState<RosterPlayer[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRosters = async () => {
    const { data } = await supabase
      .from("team_members")
      .select("user_id, ign, role, is_captain, team_id")
      .in("team_id", [teamAId, teamBId]);
    const rows = (data ?? []) as (RosterPlayer & { team_id: string })[];
    setRosterA(rows.filter((r) => r.team_id === teamAId).slice(0, 5));
    setRosterB(rows.filter((r) => r.team_id === teamBId).slice(0, 5));
    const nameMap: Record<string, string> = {};
    rows.forEach((r) => { if (r.user_id) nameMap[r.user_id] = r.ign; });
    setSenderNames((prev) => ({ ...nameMap, ...prev }));
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("lobby_messages")
      .select("*")
      .eq("lobby_id", lobbyId)
      .order("created_at", { ascending: true })
      .limit(300);
    setMessages((data ?? []) as LobbyMessage[]);
  };

  useEffect(() => { loadRosters(); loadMessages(); }, [lobbyId, teamAId, teamBId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`lobby_room_${lobbyId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lobby_messages", filter: `lobby_id=eq.${lobbyId}` }, (payload) => {
        const m = payload.new as LobbyMessage;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [lobbyId, user?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("lobby_messages").insert({
      lobby_id: lobbyId, sender_id: user.id, content,
    });
    if (error) setText(content);
    setSending(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const renderRoster = (roster: RosterPlayer[], teamName: string) => (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-primary uppercase tracking-wider">{teamName}</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {roster.filter((p) => online.has(p.user_id)).length}/{roster.length} online
        </Badge>
      </div>
      <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const p = roster[i];
          const isOnline = p && online.has(p.user_id);
          const isMe = p && p.user_id === user?.id;
          return (
            <li key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
              p ? "bg-muted/30 border-border/40" : "bg-muted/10 border-dashed border-border/30"
            }`}>
              <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
              {p ? (
                <>
                  <Circle className={`h-2 w-2 shrink-0 ${isOnline ? "fill-green-500 text-green-500" : "fill-muted-foreground/40 text-muted-foreground/40"}`} />
                  <span className="text-sm font-medium truncate flex-1">{p.ign}{isMe && <span className="text-xs text-muted-foreground ml-1">(you)</span>}</span>
                  {p.is_captain && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">C</Badge>}
                  {p.role && <span className="text-[10px] text-muted-foreground">{p.role}</span>}
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Empty slot</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderRoster(rosterA, teamAName)}
        {renderRoster(rosterB, teamBName)}
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Lobby Chat</span>
          <span className="text-[10px] text-muted-foreground ml-auto">All 10 players</span>
        </div>
        <div className="flex flex-col h-[360px] bg-muted/20 border border-border/40 rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Waiting room is quiet. Say gg!</p>
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {!isMine && (
                      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">
                        {senderNames[m.sender_id] ?? "Player"}
                      </p>
                    )}
                    <p className="break-words [overflow-wrap:anywhere]">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(m.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-border/40 bg-background/40">
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="Message the lobby..."
                aria-label="Lobby chat message"
                className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button size="icon" variant="neon" onClick={send} disabled={!text.trim() || sending} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
