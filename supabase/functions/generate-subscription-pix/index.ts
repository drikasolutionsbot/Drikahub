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
    const { tenant_id, email } = await req.json();

    if (!tenant_id) throw new Error("Missing tenant_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: config, error: configErr } = await supabase
      .from("landing_config")
      .select("*")
      .limit(1)
      .single();

    if (configErr || !config) {
      throw new Error("Configuração de pagamento não encontrada");
    }

    const amountCents = config.pro_price_cents || 2690;

    // Determine which provider to use
    if (config.efi_active && config.efi_client_id && config.efi_client_secret && config.efi_cert_pem && config.efi_key_pem) {
      return await generateViaEfi(config, tenant_id, email, amountCents, supabase, supabaseUrl);
    } else if (config.pushinpay_active && config.pushinpay_api_key) {
      return await generateViaPushinPay(config, tenant_id, email, amountCents, supabase);
    } else {
      throw new Error("Nenhum provedor de pagamento ativo. Ative Efí ou PushinPay no painel admin.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate-subscription-pix error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateViaEfi(config: any, tenant_id: string, email: string | undefined, amountCents: number, supabase: any, supabaseUrl: string) {
  const amountBRL = amountCents / 100;
  const txId = crypto.randomUUID().replace(/-/g, "").slice(0, 30);

  const normalizedCert = (config.efi_cert_pem || '').replace(/\r\n/g, '\n').trim();
  const normalizedKey = (config.efi_key_pem || '').replace(/\r\n/g, '\n').trim();
  const httpClient = Deno.createHttpClient({
    certChain: normalizedCert,
    privateKey: normalizedKey,
    cert: normalizedCert,
    key: normalizedKey,
  } as any);

  // OAuth token
  const credentials = btoa(`${config.efi_client_id}:${config.efi_client_secret}`);
  const tokenRes = await fetch("https://pix.api.efipay.com.br/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
    client: httpClient,
  } as any);

  if (!tokenRes.ok) {
    const tokenErr = await tokenRes.text();
    console.error("Efí OAuth error:", tokenErr);
    throw new Error(`Erro de autenticação Efí: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Create charge
  const cobRes = await fetch(`https://pix.api.efipay.com.br/v2/cob/${txId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      calendario: { expiracao: 900 },
      valor: { original: amountBRL.toFixed(2) },
      chave: config.efi_pix_key || "",
      infoAdicionais: [{ nome: "Plano", valor: "Pro - Drika Hub" }],
    }),
    client: httpClient,
  } as any);

  if (!cobRes.ok) {
    const cobErr = await cobRes.json().catch(() => ({}));
    console.error("Efí cob error:", JSON.stringify(cobErr));
    throw new Error(cobErr.mensagem || `Erro ao criar cobrança: ${cobRes.status}`);
  }

  const cobData = await cobRes.json();
  let brcode = cobData.pixCopiaECola || "";
  let qrCodeBase64: string | null = null;

  const locId = cobData.loc?.id;
  if (locId) {
    const qrRes = await fetch(`https://pix.api.efipay.com.br/v2/loc/${locId}/qrcode`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      client: httpClient,
    } as any);
    if (qrRes.ok) {
      const qrData = await qrRes.json();
      brcode = qrData.qrcode || brcode;
      qrCodeBase64 = qrData.imagemQrcode || null;
    }
  }

  const paymentId = cobData.txid || txId;

  await supabase.from("subscription_payments").insert({
    tenant_id,
    plan: "pro",
    amount_cents: amountCents,
    payment_provider: "efi",
    payment_id: paymentId,
    payer_email: email || null,
    status: "pending",
  });

  console.log(`Subscription PIX generated via Efí for tenant ${tenant_id}, txid ${paymentId}`);

  return new Response(
    JSON.stringify({
      success: true,
      brcode,
      qr_code_base64: qrCodeBase64,
      payment_id: paymentId,
      amount_cents: amountCents,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function generateViaPushinPay(config: any, tenant_id: string, email: string | undefined, amountCents: number, supabase: any) {
  const apiKey = config.pushinpay_api_key;

  const res = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: amountCents,
      webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/subscription-webhook`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("PushinPay error:", errText);
    throw new Error(`Erro PushinPay: ${res.status}`);
  }

  const data = await res.json();
  const brcode = data.qr_code || data.brcode || "";
  const qrCodeBase64 = data.qr_code_base64 || null;
  const paymentId = data.id || data.transaction_id || crypto.randomUUID();

  await supabase.from("subscription_payments").insert({
    tenant_id,
    plan: "pro",
    amount_cents: amountCents,
    payment_provider: "pushinpay",
    payment_id: String(paymentId),
    payer_email: email || null,
    status: "pending",
  });

  console.log(`Subscription PIX generated via PushinPay for tenant ${tenant_id}, id ${paymentId}`);

  return new Response(
    JSON.stringify({
      success: true,
      brcode,
      qr_code_base64: qrCodeBase64,
      payment_id: paymentId,
      amount_cents: amountCents,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
