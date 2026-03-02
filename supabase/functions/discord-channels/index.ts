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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { guild_id } = await req.json();
    if (!guild_id) {
      throw new Error("Missing guild_id");
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) {
      throw new Error("Bot token not configured");
    }

    // Fetch channels from Discord API using Bot token
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guild_id}/channels`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API error [${res.status}]: ${text}`);
    }

    const channels = await res.json();

    // Filter to text channels (type 0) and categories (type 4) for context
    const textChannels = channels
      .filter((c: any) => c.type === 0)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id,
        position: c.position,
      }))
      .sort((a: any, b: any) => a.position - b.position);

    const categories = channels
      .filter((c: any) => c.type === 4)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        position: c.position,
      }))
      .sort((a: any, b: any) => a.position - b.position);

    return new Response(
      JSON.stringify({ channels: textChannels, categories }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
