import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, Users } from "lucide-react";
import { format } from "date-fns";

interface TeamMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface SenderInfo {
  display_name: string | null;
  ign?: string | null;
}

export function TeamChat({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [senders, setSenders] = useState<Record<string, SenderInfo>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSenderNames = async (ids: string[]) => {
    const missing = ids.filter((id) => !senders[id]);
    if (missing.length === 0) return;
    const [{ data: profs }, { data: tms }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", missing),
      supabase.from("team_members").select("user_id, ign").eq("team_id", teamId).in("user_id", missing),
    ]);
    const map: Record<string, SenderInfo> = {};
    missing.forEach((id) => {
      const ign = tms?.find((t) => t.user_id === id)?.ign ?? null;
      const display_name = profs?.find((p) => p.user_id === id)?.display_name ?? null;
      map[id] = { display_name, ign };
    });
    setSenders((prev) => ({ ...prev, ...map }));
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("team_messages")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .limit(200);
    const msgs = (data ?? []) as TeamMessage[];
    setMessages(msgs);
    await loadSenderNames(Array.from(new Set(msgs.map((m) => m.sender_id))));
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`team_chat_${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        async (payload) => {
          const m = payload.new as TeamMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          await loadSenderNames([m.sender_id]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    const { error } = await supabase.from("team_messages").insert({
      team_id: teamId,
      sender_id: user.id,
      content,
    });
    if (error) setNewMessage(content);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const nameFor = (id: string) => {
    const s = senders[id];
    return s?.ign || s?.display_name || "Teammate";
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono text-primary tracking-wider uppercase">Team Chat</span>
      </div>

      <div className="flex flex-col h-[420px] bg-muted/20 border border-border/40 rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {!isMine && (
                    <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{nameFor(msg.sender_id)}</p>
                  )}
                  <p className="break-words [overflow-wrap:anywhere]">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your team..."
              aria-label="Team chat message"
              className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="icon" variant="neon" onClick={handleSend} disabled={!newMessage.trim() || sending} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
