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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) throw new Error("Não autorizado");

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!callerRole) throw new Error("Acesso negado: apenas super admins");

    const { action, ...params } = await req.json();

    switch (action) {
      case "list": {
        // List all super_admin users
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("id, user_id, role, created_at")
          .eq("role", "super_admin")
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Get user emails from auth
        const userIds = (roles || []).map((r: any) => r.user_id);
        const usersInfo: any[] = [];

        for (const uid of userIds) {
          const { data: { user } } = await supabase.auth.admin.getUserById(uid);
          if (user) {
            usersInfo.push({
              id: roles!.find((r: any) => r.user_id === uid)?.id,
              user_id: uid,
              email: user.email,
              created_at: user.created_at,
              is_caller: uid === caller.id,
            });
          }
        }

        return new Response(JSON.stringify(usersInfo), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { email, password } = params;
        if (!email || !password) throw new Error("Email e senha são obrigatórios");
        if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");

        // Create user in auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          if (createError.message.includes("already been registered")) {
            throw new Error("Este email já está cadastrado");
          }
          throw createError;
        }

        // Assign super_admin role (use a dummy tenant_id since the schema requires it)
        // We'll use a fixed UUID for admin roles
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: newUser.user!.id,
            role: "super_admin",
            tenant_id: "00000000-0000-0000-0000-000000000000",
          });

        if (roleError) throw roleError;

        return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { user_id } = params;
        if (!user_id) throw new Error("user_id é obrigatório");
        if (user_id === caller.id) throw new Error("Você não pode remover seu próprio acesso");

        // Remove role
        const { error: delError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", "super_admin");

        if (delError) throw delError;

        // Optionally delete the auth user too
        await supabase.auth.admin.deleteUser(user_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
