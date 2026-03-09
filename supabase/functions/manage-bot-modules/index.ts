import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODULES = [
  { module_key: "welcome", name: "Boas-Vindas", description: "Mensagens automáticas ao entrar no servidor", enabled: true, icon_key: "hand-metal", color: "text-green-400" },
  { module_key: "store", name: "Loja", description: "Sistema de vendas com pagamentos integrados", enabled: true, icon_key: "store", color: "text-secondary" },
  { module_key: "tickets", name: "Tickets", description: "Suporte via canais privados", enabled: true, icon_key: "ticket", color: "text-blue-400" },
  { module_key: "protection", name: "Proteção", description: "Anti-raid, anti-spam e verificação", enabled: true, icon_key: "shield", color: "text-destructive" },
  { module_key: "automations", name: "Ações Automáticas", description: "Respostas automáticas e triggers", enabled: false, icon_key: "zap", color: "text-amber-400" },
  { module_key: "giveaways", name: "Sorteios", description: "Crie e gerencie sorteios no servidor", enabled: false, icon_key: "gift", color: "text-purple-400" },
  { module_key: "vips", name: "VIPs", description: "Planos de assinatura com cargos automáticos", enabled: false, icon_key: "crown", color: "text-yellow-400" },
  { module_key: "invite-tracking", name: "Rastreamento de Convites", description: "Acompanhe quem convidou quem", enabled: false, icon_key: "link-2", color: "text-cyan-400" },
  { module_key: "ecloud", name: "eCloud", description: "Hospedagem e armazenamento de arquivos", enabled: false, icon_key: "cloud", color: "text-sky-400" },
  { module_key: "logs", name: "Logs", description: "Registro de ações no servidor", enabled: true, icon_key: "message-square", color: "text-muted-foreground" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, tenant_id, ...params } = await req.json();
    if (!tenant_id) throw new Error("Missing tenant_id");

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("bot_modules")
          .select("*")
          .eq("tenant_id", tenant_id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Seed defaults if empty
        if (!data || data.length === 0) {
          const seedData = DEFAULT_MODULES.map((mod) => ({
            tenant_id,
            ...mod,
            custom: false,
          }));

          const { data: seeded, error: seedErr } = await supabase
            .from("bot_modules")
            .insert(seedData)
            .select();

          if (seedErr) throw seedErr;
          return new Response(JSON.stringify(seeded), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { name, description, icon_key, color } = params;
        if (!name) throw new Error("Missing name");

        const moduleKey = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const { data, error } = await supabase
          .from("bot_modules")
          .insert({
            tenant_id,
            module_key: moduleKey,
            name,
            description: description || "",
            enabled: true,
            custom: true,
            icon_key: icon_key || "puzzle",
            color: color || "text-primary",
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { id, ...updates } = params;
        if (!id) throw new Error("Missing id");

        const allowedFields = ["name", "description", "enabled", "icon_key", "color"];
        const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowedFields) {
          if (updates[key] !== undefined) safeUpdates[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("bot_modules")
          .update(safeUpdates)
          .eq("id", id)
          .eq("tenant_id", tenant_id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { id } = params;
        if (!id) throw new Error("Missing id");

        const { error } = await supabase
          .from("bot_modules")
          .delete()
          .eq("id", id)
          .eq("tenant_id", tenant_id)
          .match({ custom: true });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
