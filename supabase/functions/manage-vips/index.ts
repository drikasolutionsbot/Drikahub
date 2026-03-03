import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // ---- PLANS ----
    if (action === "list_plans") {
      const { data, error } = await supabase
        .from("vip_plans")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create_plan") {
      const { name, description, price_cents, duration_days, discord_role_id } = body;
      const { data, error } = await supabase
        .from("vip_plans")
        .insert({ tenant_id, name, description, price_cents: price_cents || 0, duration_days: duration_days || 30, discord_role_id })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_plan") {
      const { plan_id, ...fields } = body;
      delete fields.action;
      delete fields.tenant_id;
      const { data, error } = await supabase
        .from("vip_plans")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", plan_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete_plan") {
      const { plan_id } = body;
      const { error } = await supabase.from("vip_plans").delete().eq("id", plan_id).eq("tenant_id", tenant_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- MEMBERS ----
    if (action === "list_members") {
      const { data, error } = await supabase
        .from("vip_members")
        .select("*, vip_plans(name)")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "add_member") {
      const { plan_id, discord_user_id, discord_username, duration_days } = body;
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + (duration_days || 30));
      const { data, error } = await supabase
        .from("vip_members")
        .insert({ tenant_id, plan_id, discord_user_id, discord_username, expires_at: expires_at.toISOString() })
        .select("*, vip_plans(name)")
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "remove_member") {
      const { member_id } = body;
      const { error } = await supabase.from("vip_members").delete().eq("id", member_id).eq("tenant_id", tenant_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "toggle_member") {
      const { member_id, active } = body;
      const { data, error } = await supabase
        .from("vip_members")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", member_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
