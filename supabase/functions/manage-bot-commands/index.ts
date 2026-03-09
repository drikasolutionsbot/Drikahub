import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_COMMANDS = [
  { name: "/painel", description: "Abre o painel administrativo no Discord", category: "Admin", enabled: true },
  { name: "/comprar", description: "Inicia o fluxo de compra de um produto", category: "Loja", enabled: true },
  { name: "/carrinho", description: "Exibe o carrinho do usuário", category: "Loja", enabled: true },
  { name: "/estoque", description: "Verifica o estoque de um produto", category: "Loja", enabled: true },
  { name: "/ticket", description: "Abre um ticket de suporte", category: "Suporte", enabled: true },
  { name: "/fechar", description: "Fecha o ticket atual", category: "Suporte", enabled: true },
  { name: "/rank", description: "Exibe o ranking de convites", category: "Convites", enabled: false },
  { name: "/convites", description: "Mostra quantos convites o usuário tem", category: "Convites", enabled: false },
  { name: "/sortear", description: "Cria um novo sorteio", category: "Sorteios", enabled: false },
  { name: "/vip", description: "Ativa um plano VIP para o usuário", category: "VIP", enabled: true },
  { name: "/ban", description: "Bane um usuário do servidor", category: "Moderação", enabled: true },
  { name: "/kick", description: "Expulsa um usuário do servidor", category: "Moderação", enabled: true },
  { name: "/clear", description: "Limpa mensagens do canal", category: "Moderação", enabled: true },
  { name: "/afiliado", description: "Gera um link de afiliado", category: "Loja", enabled: false },
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
          .from("bot_commands")
          .select("*")
          .eq("tenant_id", tenant_id)
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;

        // If no commands exist, seed defaults
        if (!data || data.length === 0) {
          const seedData = DEFAULT_COMMANDS.map((cmd) => ({
            tenant_id,
            name: cmd.name,
            description: cmd.description,
            category: cmd.category,
            enabled: cmd.enabled,
            is_default: true,
            options: [],
          }));

          const { data: seeded, error: seedErr } = await supabase
            .from("bot_commands")
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
        const { name, description, category, options } = params;
        if (!name || !description) throw new Error("Missing name or description");

        const cmdName = name.startsWith("/") ? name.toLowerCase() : `/${name.toLowerCase()}`;

        const { data, error } = await supabase
          .from("bot_commands")
          .insert({
            tenant_id,
            name: cmdName,
            description,
            category: category || "Custom",
            enabled: true,
            is_default: false,
            options: options || [],
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

        const allowedFields = ["name", "description", "category", "enabled", "options"];
        const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowedFields) {
          if (updates[key] !== undefined) safeUpdates[key] = updates[key];
        }

        const { data, error } = await supabase
          .from("bot_commands")
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
          .from("bot_commands")
          .delete()
          .eq("id", id)
          .eq("tenant_id", tenant_id);

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
