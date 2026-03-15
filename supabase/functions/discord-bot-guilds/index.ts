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
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) throw new Error("Bot token not configured");

    // Parse tenant_id from request body (optional for backward compat)
    let tenantId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body?.tenant_id || null;
    } catch {
      // No body sent — backward compat
    }

    // Fetch all guilds the bot is in
    const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API error [${res.status}]: ${text}`);
    }

    const guilds = await res.json();

    const mapped = guilds.map((g: any) => ({
      id: g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
        : null,
    }));

    // If tenant_id provided, filter to only show:
    // 1. The tenant's own guild
    // 2. Guilds not claimed by ANY other tenant
    if (tenantId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Get the current tenant's guild
      const { data: currentTenant } = await supabase
        .from("tenants")
        .select("discord_guild_id")
        .eq("id", tenantId)
        .single();

      const myGuildId = currentTenant?.discord_guild_id;

      // Get all guild IDs claimed by OTHER tenants
      const { data: otherTenants } = await supabase
        .from("tenants")
        .select("discord_guild_id")
        .neq("id", tenantId)
        .not("discord_guild_id", "is", null);

      const claimedGuildIds = new Set(
        (otherTenants || []).map((t: any) => t.discord_guild_id).filter(Boolean)
      );

      // Filter: show only my guild + unclaimed guilds
      const filtered = mapped.filter((g: any) =>
        g.id === myGuildId || !claimedGuildIds.has(g.id)
      );

      return new Response(JSON.stringify(filtered), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No tenant_id: return all (backward compat for onboarding)
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
