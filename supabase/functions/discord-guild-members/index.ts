import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { guild_id, query, limit = 20, tenant_id } = await req.json();

    if (!guild_id && tenant_id) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: tenant } = await supabase
        .from("tenants")
        .select("discord_guild_id")
        .eq("id", tenant_id)
        .single();
      guild_id = tenant?.discord_guild_id;
    }

    if (!guild_id) throw new Error("Missing guild_id");

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN") || null;
    if (!botToken) throw new Error("Bot externo não configurado (DISCORD_BOT_TOKEN)");

    const searchQuery = query?.trim() || "";
    
    let url: string;
    if (searchQuery.length > 0) {
      url = `https://discord.com/api/v10/guilds/${guild_id}/members/search?query=${encodeURIComponent(searchQuery)}&limit=${limit}`;
    } else {
      url = `https://discord.com/api/v10/guilds/${guild_id}/members?limit=${limit}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API error [${res.status}]: ${text}`);
    }

    const members = await res.json();

    const mapped = members.map((m: any) => ({
      id: m.user.id,
      username: m.user.username,
      displayName: m.nick || m.user.global_name || m.user.username,
      avatar: m.user.avatar
        ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=64`
        : null,
      bot: m.user.bot || false,
    })).filter((m: any) => !m.bot);

    return new Response(JSON.stringify(mapped), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
