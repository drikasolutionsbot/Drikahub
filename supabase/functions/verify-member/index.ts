import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DISCORD_API = "https://discord.com/api/v10";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const tenantId = url.searchParams.get("tenant_id");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // state = tenant_id (passed through OAuth)

  const clientId = "1477916070508757092";
  const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;
  const redirectUri = `${supabaseUrl}/functions/v1/verify-member`;

  console.log("verify-member init", { tenantId, hasCode: Boolean(code), clientId, redirectUri });

  // ─── Step 1: No code yet → redirect to Discord OAuth2 ────
  if (!code) {
    if (!tenantId) {
      return htmlResponse("❌ Erro", "Tenant não informado.", "#ED4245");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify guilds.join",
      state: tenantId,
      prompt: "consent",
    });

    return Response.redirect(`https://discord.com/api/oauth2/authorize?${params}`, 302);
  }

  // ─── Step 2: Received code → exchange for token ───────────
  const effectiveTenantId = state || tenantId;
  if (!effectiveTenantId) {
    return htmlResponse("❌ Erro", "Tenant não encontrado no estado.", "#ED4245");
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange error:", errText);
      return htmlResponse("❌ Erro na Verificação", "Não foi possível autenticar com o Discord. Tente novamente.", "#ED4245");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // Get user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return htmlResponse("❌ Erro", "Não foi possível obter suas informações do Discord.", "#ED4245");
    }

    const user = await userRes.json();
    const discordUserId = user.id;
    const discordUsername = user.username;
    const discordAvatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null;

    // Get tenant config
    const { data: tenantData, error: tenantErr } = await supabase
      .from("tenants")
      .select("verify_enabled, verify_role_id, discord_guild_id, bot_token_encrypted, name, logo_url")
      .eq("id", effectiveTenantId)
      .single();

    if (tenantErr || !tenantData) {
      return htmlResponse("❌ Erro", "Servidor não encontrado.", "#ED4245");
    }

    if (!tenantData.verify_enabled) {
      return htmlResponse("⚠️ Verificação Desativada", "A verificação está desativada neste servidor.", "#FEE75C");
    }

    const guildId = tenantData.discord_guild_id;
    const roleId = tenantData.verify_role_id;
    const botToken = tenantData.bot_token_encrypted || Deno.env.get("DISCORD_BOT_TOKEN")!;

    if (!guildId) {
      return htmlResponse("❌ Erro", "Servidor Discord não configurado.", "#ED4245");
    }

    // Add user to guild (if not already) using OAuth token
    try {
      await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          roles: roleId ? [roleId] : [],
        }),
      });
    } catch (e) {
      console.error("Add to guild error:", e);
    }

    // If user is already in the guild, add the role directly
    if (roleId) {
      try {
        await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
          method: "PUT",
          headers: { Authorization: `Bot ${botToken}` },
        });
      } catch (e) {
        console.error("Add role error:", e);
      }
    }

    // Save to verified_members table
    const tokenExpiresAt = new Date(Date.now() + (expiresIn || 604800) * 1000).toISOString();

    await supabase.from("verified_members").upsert(
      {
        tenant_id: effectiveTenantId,
        discord_user_id: discordUserId,
        discord_username: discordUsername,
        discord_avatar: discordAvatar,
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken || null,
        token_expires_at: tokenExpiresAt,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,discord_user_id" }
    );

    const serverName = tenantData.name || "o servidor";

    return htmlResponse(
      "✅ Verificado com Sucesso!",
      `Bem-vindo, <strong>${discordUsername}</strong>! Você foi verificado em <strong>${serverName}</strong>.${roleId ? "<br>Seu cargo foi atribuído automaticamente." : ""}<br><br>Pode fechar esta página e voltar ao Discord.`,
      "#57F287",
      tenantData.logo_url
    );
  } catch (err) {
    console.error("Verify member error:", err);
    return htmlResponse("❌ Erro", `Ocorreu um erro durante a verificação: ${err instanceof Error ? err.message : "Erro desconhecido"}`, "#ED4245");
  }
});

function htmlResponse(title: string, message: string, color: string, logoUrl?: string | null): Response {
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="width:64px;height:64px;border-radius:50%;margin-bottom:16px;object-fit:cover;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e0e0e0;
      padding: 20px;
    }
    .card {
      background: #16213e;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      border-top: 4px solid ${color};
    }
    h1 { font-size: 24px; margin-bottom: 16px; color: ${color}; }
    p { font-size: 15px; line-height: 1.6; color: #b0b0b0; }
    p strong { color: #e0e0e0; }
    .discord-btn {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 32px;
      background: #5865F2;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    }
    .discord-btn:hover { background: #4752C4; }
  </style>
</head>
<body>
  <div class="card">
    ${logo}
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://discord.com/channels/@me" class="discord-btn">Voltar ao Discord</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
