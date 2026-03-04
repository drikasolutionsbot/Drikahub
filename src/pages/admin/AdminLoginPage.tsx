import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if user is super_admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: "Acesso negado", description: "Você não tem permissão de administrador.", variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Bem-vindo, Admin!" });
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center admin-pattern-bg">

      <div className="relative z-10 w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          {!imgError ? (
            <img src={logo} alt="Admin" className="h-28 w-28 object-contain" onError={() => setImgError(true)} />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-bold text-primary">A</div>
          )}
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-widest uppercase">
              <span className="text-gradient-pink">ADMIN</span>{" "}
              <span className="text-gradient-gold">PANEL</span>
            </h1>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Acesso restrito a super administradores
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-3">
            <div className="relative login-floating-input">
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-base px-4 py-3 bg-transparent border-2 border-white/30 rounded-[20px] outline-none text-white transition-colors focus:border-primary"
              />
              <label className="absolute left-0 px-4 py-3 ml-2 pointer-events-none text-white/70 font-semibold text-base tracking-wide transition-all duration-300">
                Email do administrador
              </label>
            </div>
            <div className="relative login-floating-input">
              <input
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-base px-4 py-3 bg-transparent border-2 border-white/30 rounded-[20px] outline-none text-white transition-colors focus:border-primary"
              />
              <label className="absolute left-0 px-4 py-3 ml-2 pointer-events-none text-white/70 font-semibold text-base tracking-wide transition-all duration-300">
                Senha
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-full bg-[#FF2849] hover:bg-[#e52441] text-white font-medium text-base tracking-wide cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
            ) : (
              <>
                <LogIn className="h-5 w-5 group-hover:animate-[flickering_2s_linear_infinite]" />
                <span>Entrar</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-white/60">
            Apenas usuários com permissão de super admin podem acessar.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
