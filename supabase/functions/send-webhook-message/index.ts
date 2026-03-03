import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_API = "https://discord.com/api/v10";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, channel_id, content, embeds, product_id, components } = await req.json();

    if (!tenant_id) throw new Error("Missing tenant_id");
    if (!channel_id) throw new Error("Missing channel_id");
    if (!content && (!embeds || embeds.length === 0)) {
      throw new Error("Missing content or embeds");
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) throw new Error("DISCORD_BOT_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch tenant info for white-label identity
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, logo_url")
      .eq("id", tenant_id)
      .single();

    const tenantName = tenant?.name || "Bot";
    const tenantLogo = tenant?.logo_url || undefined;

    // Determine if we need interactive buttons (product_id present)
    let buttonComponents: any[] | null = null;

    if (product_id) {
      // Check for variations
      const { data: fields } = await supabase
        .from("product_fields")
        .select("id")
        .eq("product_id", product_id)
        .eq("tenant_id", tenant_id);

      const hasVariations = fields && fields.length > 0;

      const buttons: any[] = [
        {
          type: 2,
          style: 3,
          label: "Comprar",
          emoji: { name: "🛒" },
          custom_id: `buy_product:${product_id}`,
        },
      ];

      if (hasVariations) {
        buttons.push({
          type: 2,
          style: 2,
          label: "Variações",
          emoji: { name: "📋" },
          custom_id: `view_variations:${product_id}`,
        });
      }

      buttons.push({
        type: 2,
        style: 2,
        label: "Detalhes",
        emoji: { name: "ℹ️" },
        custom_id: `view_details:${product_id}`,
      });

      buttonComponents = [{ type: 1, components: buttons }];
    }

    // --- Strategy: Use webhook for embed (white-label) + bot for buttons ---
    // If we have product buttons, send embed via webhook and buttons via bot separately
    // If no buttons needed, just send via webhook for white-label

    // Step 1: Get or create a webhook for this channel
    const webhookUrl = await getOrCreateWebhook(botToken, channel_id, tenantName);

    // Step 2: Send embed via webhook (with custom name/avatar)
    const webhookPayload: Record<string, any> = {
      username: tenantName,
    };
    if (tenantLogo) webhookPayload.avatar_url = tenantLogo;
    if (content) webhookPayload.content = content;
    if (embeds) webhookPayload.embeds = embeds;

    // If no buttons needed, include components in webhook (non-interactive)
    if (!buttonComponents && components) {
      // Webhooks don't support interactive components, so skip
    }

    const webhookRes = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text();
      console.error("Webhook send failed:", webhookRes.status, errText);
      throw new Error(`Webhook error: ${webhookRes.status} - ${errText}`);
    }

    const webhookMessage = await webhookRes.json();
    let botMessageId: string | null = null;

    // Step 3: If we have interactive buttons, send them as a separate bot message
    if (buttonComponents) {
      const botPayload = {
        components: buttonComponents,
        // Reference context so user knows what buttons are for
        content: "",
      };

      const botRes = await fetch(`${DISCORD_API}/channels/${channel_id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(botPayload),
      });

      if (!botRes.ok) {
        const errText = await botRes.text();
        console.error("Bot buttons message failed:", botRes.status, errText);
        // Don't throw - embed was sent successfully, just log the button failure
      } else {
        const botMessage = await botRes.json();
        botMessageId = botMessage.id;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: webhookMessage.id,
      button_message_id: botMessageId,
    }), {
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

/**
 * Gets an existing webhook for the channel or creates a new one.
 * Returns the full webhook URL (with token).
 */
async function getOrCreateWebhook(botToken: string, channelId: string, botName: string): Promise<string> {
  // List existing webhooks for the channel
  const listRes = await fetch(`${DISCORD_API}/channels/${channelId}/webhooks`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (listRes.ok) {
    const webhooks = await listRes.json();
    // Find a webhook created by our bot
    const existing = webhooks.find((wh: any) => wh.name === "Drika Store" || wh.name === botName);
    if (existing && existing.token) {
      return `${DISCORD_API}/webhooks/${existing.id}/${existing.token}`;
    }
  }

  // Create a new webhook
  const createRes = await fetch(`${DISCORD_API}/channels/${channelId}/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Drika Store" }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create webhook: ${createRes.status} - ${errText}`);
  }

  const webhook = await createRes.json();
  return `${DISCORD_API}/webhooks/${webhook.id}/${webhook.token}`;
}
