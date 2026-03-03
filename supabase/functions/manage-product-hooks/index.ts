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
    const { action, tenant_id, product_id, hook, hook_id } = await req.json();
    if (!tenant_id) throw new Error("Missing tenant_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "list") {
      if (!product_id) throw new Error("Missing product_id");
      const { data, error } = await supabase
        .from("product_hooks")
        .select("*")
        .eq("product_id", product_id)
        .eq("tenant_id", tenant_id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      if (!product_id || !hook?.hook_type) throw new Error("Missing product_id or hook_type");
      const { data, error } = await supabase
        .from("product_hooks")
        .insert({
          product_id,
          tenant_id,
          hook_type: hook.hook_type,
          config: hook.config || {},
          active: hook.active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!hook_id) throw new Error("Missing hook_id");
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (hook?.config !== undefined) updates.config = hook.config;
      if (hook?.active !== undefined) updates.active = hook.active;
      if (hook?.hook_type !== undefined) updates.hook_type = hook.hook_type;

      const { data, error } = await supabase
        .from("product_hooks")
        .update(updates)
        .eq("id", hook_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!hook_id) throw new Error("Missing hook_id");
      const { error } = await supabase
        .from("product_hooks")
        .delete()
        .eq("id", hook_id)
        .eq("tenant_id", tenant_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
