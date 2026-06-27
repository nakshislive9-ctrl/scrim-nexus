import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require a valid Supabase JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const { lobby_id } = await req.json();
    if (!lobby_id || typeof lobby_id !== "string") {
      return new Response(JSON.stringify({ error: "lobby_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lobby, error } = await supabase
      .from("scrim_lobbies")
      .select("id, game, status, team_a_id, team_a_captain_id, team_b_id, team_b_captain_id, discord_pinged_at")
      .eq("id", lobby_id)
      .maybeSingle();

    if (error || !lobby) {
      return new Response(JSON.stringify({ error: "lobby not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the two lobby captains can trigger the ping
    if (callerId !== lobby.team_a_captain_id && callerId !== lobby.team_b_captain_id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lobby.team_b_id) {
      return new Response(JSON.stringify({ skipped: "no opponent yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lobby.discord_pinged_at) {
      return new Response(JSON.stringify({ skipped: "already pinged" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, rank, region, discord_webhook_url")
      .in("id", [lobby.team_a_id, lobby.team_b_id]);

    const teamA = teams?.find((t) => t.id === lobby.team_a_id);
    const teamB = teams?.find((t) => t.id === lobby.team_b_id);
    const webhook = teamA?.discord_webhook_url;

    if (!webhook) {
      return new Response(JSON.stringify({ skipped: "no webhook configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side SSRF guard: only allow official Discord webhook URLs
    const ALLOWED_WEBHOOK = /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//i;
    if (!ALLOWED_WEBHOOK.test(webhook)) {
      return new Response(JSON.stringify({ error: "invalid_webhook_domain" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lobbyUrl = `${req.headers.get("origin") ?? ""}/lobby/${lobby.id}`;

    const payload = {
      username: "ScrimHQ",
      embeds: [
        {
          title: `⚔️ Opponent locked in: ${teamB?.name ?? "Unknown"}`,
          description: `Your ${lobby.game} scrim is ready. Map veto is starting now.`,
          color: 0x22d3ee,
          fields: [
            { name: "Your team", value: teamA?.name ?? "—", inline: true },
            { name: "Opponent", value: `${teamB?.name ?? "—"} (${teamB?.rank ?? "?"})`, inline: true },
            { name: "Region", value: teamB?.region ?? "—", inline: true },
          ],
          url: lobbyUrl || undefined,
          footer: { text: "ScrimHQ" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const dr = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!dr.ok) {
      const txt = await dr.text();
      return new Response(JSON.stringify({ error: "discord rejected", detail: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("scrim_lobbies")
      .update({ discord_pinged_at: new Date().toISOString() })
      .eq("id", lobby.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
