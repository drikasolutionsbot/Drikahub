import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getBotToken(supabase: any, tenant_id: string): Promise<string | null> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("bot_token_encrypted")
    .eq("id", tenant_id)
    .single();
  return tenant?.bot_token_encrypted || Deno.env.get("DISCORD_BOT_TOKEN") || null;
}

// Fetch 🎉 reactions from Discord message and sync to giveaway_entries
async function syncEntriesFromDiscord(
  supabase: any,
  botToken: string,
  giveaway: any,
  tenant_id: string
) {
  if (!giveaway.channel_id || !giveaway.message_id) return;

  try {
    // Fetch all users who reacted with 🎉 (paginate with after param)
    const allUsers: any[] = [];
    let after = "0";
    while (true) {
      const url = `https://discord.com/api/v10/channels/${giveaway.channel_id}/messages/${giveaway.message_id}/reactions/%F0%9F%8E%89?limit=100&after=${after}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Discord reactions fetch failed:", res.status, errText);
        break;
      }
      const users = await res.json();
      if (!Array.isArray(users) || users.length === 0) break;
      // Filter out bots
      for (const u of users) {
        if (!u.bot) allUsers.push(u);
      }
      if (users.length < 100) break;
      after = users[users.length - 1].id;
    }

    if (allUsers.length === 0) return;

    // Get existing entries
    const { data: existing } = await supabase
      .from("giveaway_entries")
      .select("discord_user_id")
      .eq("giveaway_id", giveaway.id)
      .eq("tenant_id", tenant_id);

    const existingIds = new Set((existing || []).map((e: any) => e.discord_user_id));

    // Insert new entries
    const newEntries = allUsers
      .filter((u) => !existingIds.has(u.id))
      .map((u) => ({
        giveaway_id: giveaway.id,
        tenant_id,
        discord_user_id: u.id,
        discord_username: u.global_name || u.username || null,
        discord_avatar: u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
          : null,
      }));

    if (newEntries.length > 0) {
      await supabase.from("giveaway_entries").insert(newEntries);
    }

    // Remove entries for users who un-reacted
    const reactedIds = new Set(allUsers.map((u: any) => u.id));
    const toRemove = (existing || [])
      .filter((e: any) => !reactedIds.has(e.discord_user_id))
      .map((e: any) => e.discord_user_id);

    if (toRemove.length > 0) {
      await supabase
        .from("giveaway_entries")
        .delete()
        .eq("giveaway_id", giveaway.id)
        .eq("tenant_id", tenant_id)
        .in("discord_user_id", toRemove);
    }
  } catch (e) {
    console.error("syncEntriesFromDiscord error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, tenant_id } = body;
    if (!tenant_id) throw new Error("tenant_id required");

    const json = (data: any) =>
      new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // List giveaways — auto-sync entries from Discord reactions
    if (action === "list") {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Sync entries from Discord for active giveaways with message_id
      const botToken = await getBotToken(supabase, tenant_id);
      if (botToken) {
        const activeWithMsg = (data || []).filter(
          (g: any) => g.status === "active" && g.message_id
        );
        for (const g of activeWithMsg) {
          await syncEntriesFromDiscord(supabase, botToken, g, tenant_id);
        }
      }

      // Get entry counts (after sync)
      const ids = (data || []).map((g: any) => g.id);
      let entryCounts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: entries } = await supabase
          .from("giveaway_entries")
          .select("giveaway_id")
          .in("giveaway_id", ids);
        for (const e of entries || []) {
          entryCounts[e.giveaway_id] = (entryCounts[e.giveaway_id] || 0) + 1;
        }
      }

      const result = (data || []).map((g: any) => ({ ...g, entries_count: entryCounts[g.id] || 0 }));
      return json(result);
    }

    // Sync entries manually for a specific giveaway
    if (action === "sync_entries") {
      const { giveaway_id } = body;
      const { data: giveaway } = await supabase
        .from("giveaways")
        .select("*")
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .single();
      if (!giveaway) throw new Error("Giveaway not found");

      const botToken = await getBotToken(supabase, tenant_id);
      if (!botToken) throw new Error("Bot token not available");

      await syncEntriesFromDiscord(supabase, botToken, giveaway, tenant_id);

      const { count } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true })
        .eq("giveaway_id", giveaway_id)
        .eq("tenant_id", tenant_id);

      return json({ success: true, entries_count: count || 0 });
    }

    // Create giveaway
    if (action === "create") {
      const { title, description, prize, winners_count, ends_at, channel_id, require_role_id, created_by } = body;
      if (!title || !prize || !ends_at) throw new Error("title, prize, ends_at required");
      const { data, error } = await supabase
        .from("giveaways")
        .insert({
          tenant_id, title, description: description || "", prize,
          winners_count: winners_count || 1, ends_at, channel_id,
          require_role_id, created_by,
        })
        .select()
        .single();
      if (error) throw error;

      // Announce in Discord channel
      if (channel_id) {
        try {
          const botToken = await getBotToken(supabase, tenant_id);
          if (botToken) {
            const embed = {
              color: 0xFEE75C,
              title: `🎉 SORTEIO: ${title}`,
              description: `**Prêmio:** ${prize}\n\n${description || "Participe reagindo abaixo!"}\n\n⏰ **Encerra:** <t:${Math.floor(new Date(ends_at).getTime() / 1000)}:R>\n👥 **Vencedores:** ${winners_count || 1}`,
              footer: { text: "Reaja com 🎉 para participar!" },
              timestamp: new Date().toISOString(),
            };
            const res = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ embeds: [embed] }),
            });
            if (res.ok) {
              const msg = await res.json();
              await supabase.from("giveaways").update({ message_id: msg.id }).eq("id", data.id);
              // Add 🎉 reaction
              await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${msg.id}/reactions/%F0%9F%8E%89/@me`, {
                method: "PUT",
                headers: { Authorization: `Bot ${botToken}` },
              });
            } else {
              const errText = await res.text();
              console.error("Discord send failed:", res.status, errText);
            }
          } else {
            console.error("No bot token available for tenant:", tenant_id);
          }
        } catch (e) {
          console.error("Discord announce failed:", e);
        }
      }

      return json(data);
    }

    // Update giveaway
    if (action === "update") {
      const { giveaway_id, ...fields } = body;
      delete fields.action;
      delete fields.tenant_id;
      fields.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("giveaways")
        .update(fields)
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    // Delete giveaway
    if (action === "delete") {
      const { giveaway_id } = body;
      // Delete entries first
      await supabase.from("giveaway_entries").delete().eq("giveaway_id", giveaway_id).eq("tenant_id", tenant_id);
      const { error } = await supabase.from("giveaways").delete().eq("id", giveaway_id).eq("tenant_id", tenant_id);
      if (error) throw error;
      return json({ success: true });
    }

    // List entries
    if (action === "list_entries") {
      const { giveaway_id } = body;
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .order("entered_at", { ascending: true });
      if (error) throw error;
      return json(data);
    }

    // Add entry
    if (action === "add_entry") {
      const { giveaway_id, discord_user_id, discord_username, discord_avatar } = body;
      const { data, error } = await supabase
        .from("giveaway_entries")
        .insert({ giveaway_id, tenant_id, discord_user_id, discord_username, discord_avatar })
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    // Remove entry
    if (action === "remove_entry") {
      const { entry_id } = body;
      const { error } = await supabase.from("giveaway_entries").delete().eq("id", entry_id).eq("tenant_id", tenant_id);
      if (error) throw error;
      return json({ success: true });
    }

    // Draw winners — sync entries first, then pick
    if (action === "draw") {
      const { giveaway_id } = body;
      if (!giveaway_id) throw new Error("giveaway_id required");

      const { data: giveaway, error: gErr } = await supabase
        .from("giveaways")
        .select("*")
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .single();
      if (gErr || !giveaway) throw new Error("Giveaway not found");

      // Sync entries from Discord before drawing
      const botToken = await getBotToken(supabase, tenant_id);
      if (botToken && giveaway.message_id) {
        await syncEntriesFromDiscord(supabase, botToken, giveaway, tenant_id);
      }

      const { data: entries } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", giveaway_id)
        .eq("tenant_id", tenant_id);

      if (!entries || entries.length === 0) throw new Error("Nenhum participante para sortear");

      const shuffled = [...entries].sort(() => Math.random() - 0.5);
      const winnersCount = Math.min(giveaway.winners_count || 1, shuffled.length);
      const winners = shuffled.slice(0, winnersCount).map((e: any) => ({
        discord_user_id: e.discord_user_id,
        discord_username: e.discord_username,
      }));

      const { data: updated, error: uErr } = await supabase
        .from("giveaways")
        .update({ winners, status: "ended", updated_at: new Date().toISOString() })
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (uErr) throw uErr;

      // Announce winners in Discord
      if (giveaway.channel_id && botToken) {
        try {
          const winnerMentions = winners.map((w: any) => `<@${w.discord_user_id}>`).join(", ");
          const embed = {
            color: 0x57F287,
            title: `🎉 Sorteio Encerrado: ${giveaway.title}`,
            description: `**Prêmio:** ${giveaway.prize}\n\n🏆 **Vencedor${winnersCount > 1 ? "es" : ""}:** ${winnerMentions}\n\nParabéns! 🥳`,
            footer: { text: `${entries.length} participantes` },
            timestamp: new Date().toISOString(),
          };
          await fetch(`https://discord.com/api/v10/channels/${giveaway.channel_id}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: `🎉 ${winnerMentions}`, embeds: [embed] }),
          });
        } catch (e) {
          console.error("Discord winner announce failed:", e);
        }
      }

      return json({ ...updated, entries_count: entries.length });
    }

    // Reroll
    if (action === "reroll") {
      const { giveaway_id, count } = body;
      const { data: entries } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", giveaway_id)
        .eq("tenant_id", tenant_id);

      if (!entries || entries.length === 0) throw new Error("No entries");

      const { data: giveaway } = await supabase
        .from("giveaways")
        .select("winners")
        .eq("id", giveaway_id)
        .single();

      const prevWinnerIds = (giveaway?.winners || []).map((w: any) => w.discord_user_id);
      const eligible = entries.filter((e: any) => !prevWinnerIds.includes(e.discord_user_id));

      if (eligible.length === 0) throw new Error("No eligible entries for reroll");

      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      const newWinners = shuffled.slice(0, count || 1).map((e: any) => ({
        discord_user_id: e.discord_user_id,
        discord_username: e.discord_username,
      }));

      const { data: updated, error } = await supabase
        .from("giveaways")
        .update({ winners: [...(giveaway?.winners || []), ...newWinners], updated_at: new Date().toISOString() })
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;

      return json(updated);
    }

    // Cancel giveaway
    if (action === "cancel") {
      const { giveaway_id } = body;
      const { data, error } = await supabase
        .from("giveaways")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("id", giveaway_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
