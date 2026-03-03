import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_API = "https://discord.com/api/v10";

async function getOrCreateWebhook(channelId: string, botToken: string, webhookName: string): Promise<{ id: string; token: string } | null> {
  // Check existing webhooks in the channel
  const listRes = await fetch(`${DISCORD_API}/channels/${channelId}/webhooks`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!listRes.ok) {
    console.error("Failed to list webhooks:", await listRes.text());
    return null;
  }

  const webhooks = await listRes.json();
  const existing = webhooks.find((w: any) => w.name === webhookName && w.type === 1);
  
  if (existing) {
    return { id: existing.id, token: existing.token };
  }

  // Create a new webhook
  const createRes = await fetch(`${DISCORD_API}/channels/${channelId}/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: webhookName }),
  });

  if (!createRes.ok) {
    console.error("Failed to create webhook:", await createRes.text());
    return null;
  }

  const webhook = await createRes.json();
  return { id: webhook.id, token: webhook.token };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, channel_id, content, embeds } = await req.json();
    
    if (!tenant_id) throw new Error("Missing tenant_id");
    if (!channel_id) throw new Error("Missing channel_id");
    if (!content && (!embeds || embeds.length === 0)) {
      throw new Error("Missing content or embeds");
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) throw new Error("DISCORD_BOT_TOKEN not configured");

    // Get tenant info for webhook identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("name, logo_url")
      .eq("id", tenant_id)
      .single();

    if (tenantError) throw tenantError;

    const webhookName = `drika-${tenant_id.slice(0, 8)}`;
    const webhook = await getOrCreateWebhook(channel_id, botToken, webhookName);
    
    if (!webhook) {
      throw new Error("Failed to get or create webhook. Check bot permissions (MANAGE_WEBHOOKS).");
    }

    // Execute webhook with tenant's identity
    const payload: Record<string, any> = {};
    if (content) payload.content = content;
    if (embeds) payload.embeds = embeds;
    payload.username = tenant.name || "Drika Bot";
    if (tenant.logo_url) payload.avatar_url = tenant.logo_url;

    const execRes = await fetch(`${DISCORD_API}/webhooks/${webhook.id}/${webhook.token}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!execRes.ok) {
      const errText = await execRes.text();
      console.error("Webhook execute failed:", execRes.status, errText);
      throw new Error(`Discord webhook error: ${execRes.status}`);
    }

    const message = await execRes.json();

    return new Response(JSON.stringify({ success: true, message_id: message.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-webhook-message error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
