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
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { source_tenant_id, new_discord_guild_id } = body;

    if (!source_tenant_id) throw new Error("source_tenant_id é obrigatório");
    if (!new_discord_guild_id) throw new Error("new_discord_guild_id é obrigatório");
    if (!/^\d{17,20}$/.test(new_discord_guild_id)) {
      throw new Error("ID do servidor inválido. Deve conter 17-20 dígitos.");
    }

    // Verify user owns the source tenant
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", source_tenant_id)
      .eq("role", "owner")
      .maybeSingle();

    if (!roleCheck) throw new Error("Você não é o dono deste tenant.");

    // Check if guild is already taken
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("discord_guild_id", new_discord_guild_id)
      .maybeSingle();

    if (existing) throw new Error("Este servidor Discord já está vinculado a outra loja.");

    // Get source tenant
    const { data: source, error: sourceErr } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", source_tenant_id)
      .single();

    if (sourceErr || !source) throw new Error("Tenant de origem não encontrado.");

    // Create new tenant with cloned config
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 4);
    const referralCode = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
    const verifySlug = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toLowerCase();

    const { data: newTenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        name: source.name,
        discord_guild_id: new_discord_guild_id,
        primary_color: source.primary_color,
        secondary_color: source.secondary_color,
        plan: "free",
        plan_started_at: now.toISOString(),
        plan_expires_at: trialEnd.toISOString(),
        referral_code: referralCode,
        verify_slug: verifySlug,
        bot_name: source.bot_name,
        bot_avatar_url: source.bot_avatar_url,
        bot_status: source.bot_status,
        bot_prefix: source.bot_prefix,
        pix_key: source.pix_key,
        pix_key_type: source.pix_key_type,
        verify_enabled: source.verify_enabled,
        verify_redirect_url: source.verify_redirect_url,
        verify_role_id: source.verify_role_id,
        verify_channel_id: source.verify_channel_id,
        verify_logs_channel_id: source.verify_logs_channel_id,
        verify_title: source.verify_title,
        verify_description: source.verify_description,
        verify_button_label: source.verify_button_label,
        verify_embed_color: source.verify_embed_color,
        verify_image_url: source.verify_image_url,
        verify_button_style: source.verify_button_style,
        owner_discord_username: source.owner_discord_username,
        owner_discord_id: source.owner_discord_id,
        logo_url: source.logo_url,
        banner_url: source.banner_url,
      })
      .select()
      .single();

    if (tenantErr || !newTenant) throw tenantErr || new Error("Falha ao criar tenant clonado.");

    const newTenantId = newTenant.id;

    // Link user as owner
    await supabase.from("user_roles").insert({
      user_id: user.id,
      tenant_id: newTenantId,
      role: "owner",
    });

    // Clone store_configs
    const { data: storeConfig } = await supabase
      .from("store_configs")
      .select("*")
      .eq("tenant_id", source_tenant_id)
      .maybeSingle();

    if (storeConfig) {
      const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...configFields } = storeConfig;
      await supabase.from("store_configs").insert({
        ...configFields,
        tenant_id: newTenantId,
        // Reset discord-specific IDs since it's a new server
        logs_channel_id: null,
        sales_channel_id: null,
        ticket_channel_id: null,
        ticket_logs_channel_id: null,
        ticket_message_id: null,
      });
    }

    // Clone categories
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    const categoryMap: Record<string, string> = {};
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ name: cat.name, sort_order: cat.sort_order, tenant_id: newTenantId })
          .select("id")
          .single();
        if (newCat) categoryMap[cat.id] = newCat.id;
      }
    }

    // Clone products
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    const productMap: Record<string, string> = {};
    if (products && products.length > 0) {
      for (const prod of products) {
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...prodFields } = prod;
        const { data: newProd } = await supabase
          .from("products")
          .insert({
            ...prodFields,
            tenant_id: newTenantId,
            category_id: prod.category_id ? (categoryMap[prod.category_id] || null) : null,
            stock: prod.stock,
          })
          .select("id")
          .single();
        if (newProd) productMap[prod.id] = newProd.id;
      }
    }

    // Clone product_fields
    const { data: fields } = await supabase
      .from("product_fields")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    const fieldMap: Record<string, string> = {};
    if (fields && fields.length > 0) {
      for (const field of fields) {
        const newProductId = productMap[field.product_id];
        if (!newProductId) continue;
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...fieldData } = field;
        const { data: newField } = await supabase
          .from("product_fields")
          .insert({ ...fieldData, tenant_id: newTenantId, product_id: newProductId })
          .select("id")
          .single();
        if (newField) fieldMap[field.id] = newField.id;
      }
    }

    // Clone product_stock_items (not delivered ones)
    const { data: stockItems } = await supabase
      .from("product_stock_items")
      .select("*")
      .eq("tenant_id", source_tenant_id)
      .eq("delivered", false);

    if (stockItems && stockItems.length > 0) {
      const mapped = stockItems
        .filter((si) => si.product_id && productMap[si.product_id])
        .map((si) => ({
          content: si.content,
          product_id: productMap[si.product_id!],
          field_id: si.field_id ? (fieldMap[si.field_id] || null) : null,
          tenant_id: newTenantId,
          delivered: false,
        }));
      if (mapped.length > 0) {
        await supabase.from("product_stock_items").insert(mapped);
      }
    }

    // Clone coupons
    const { data: coupons } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", source_tenant_id)
      .eq("active", true);

    if (coupons && coupons.length > 0) {
      for (const coupon of coupons) {
        const { id: _, tenant_id: __, created_at: ___, ...couponData } = coupon;
        await supabase.from("coupons").insert({
          ...couponData,
          tenant_id: newTenantId,
          product_id: coupon.product_id ? (productMap[coupon.product_id] || null) : null,
          used_count: 0,
        });
      }
    }

    // Clone payment_providers
    const { data: providers } = await supabase
      .from("payment_providers")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    if (providers && providers.length > 0) {
      for (const prov of providers) {
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...provData } = prov;
        await supabase.from("payment_providers").insert({ ...provData, tenant_id: newTenantId });
      }
    }

    // Clone saved_embeds
    const { data: embeds } = await supabase
      .from("saved_embeds")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    if (embeds && embeds.length > 0) {
      for (const embed of embeds) {
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...embedData } = embed;
        await supabase.from("saved_embeds").insert({ ...embedData, tenant_id: newTenantId });
      }
    }

    // Clone protection_settings
    const { data: protSettings } = await supabase
      .from("protection_settings")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    if (protSettings && protSettings.length > 0) {
      for (const ps of protSettings) {
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, ...psData } = ps;
        await supabase.from("protection_settings").insert({ ...psData, tenant_id: newTenantId });
      }
    }

    // Clone automations
    const { data: automations } = await supabase
      .from("automations")
      .select("*")
      .eq("tenant_id", source_tenant_id);

    if (automations && automations.length > 0) {
      for (const auto of automations) {
        const { id: _, tenant_id: __, created_at: ___, updated_at: ____, last_executed_at: _____, ...autoData } = auto;
        await supabase.from("automations").insert({ ...autoData, tenant_id: newTenantId, executions: 0 });
      }
    }

    console.log(`Tenant cloned: ${source_tenant_id} → ${newTenantId} (guild: ${new_discord_guild_id})`);

    return new Response(JSON.stringify({ tenant: newTenant, cloned_products: Object.keys(productMap).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("clone-tenant error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
