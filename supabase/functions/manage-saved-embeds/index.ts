import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, tenant_id, id, name, embed_data } = await req.json();
    if (!tenant_id) throw new Error("tenant_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "list") {
      const { data, error } = await supabase
        .from("saved_embeds")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ embeds: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "save") {
      if (!name) throw new Error("name required");
      const { data, error } = await supabase
        .from("saved_embeds")
        .insert([{ tenant_id, name, embed_data: embed_data || {} }])
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ embed: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      if (!id) throw new Error("id required");
      const { error } = await supabase
        .from("saved_embeds")
        .update({ name, embed_data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenant_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      if (!id) throw new Error("id required");
      const { error } = await supabase
        .from("saved_embeds")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});