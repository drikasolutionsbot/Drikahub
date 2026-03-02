import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { signInWithDiscord } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [showTokenField, setShowTokenField] = useState(false);

  const handleTokenLogin = async () => {
    if (!token.trim()) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-token", {
        body: { token: token.trim() },
      });
      if (error || data?.error) {
        toast({ title: "Token inválido", description: data?.error || error?.message, variant: "destructive" });
      } else {
        // Store token session info in sessionStorage
        sessionStorage.setItem("token_session", JSON.stringify({
          tenant_id: data.tenant_id,
          tenant_name: data.tenant_name,
          token: token.trim(),
        }));
        toast({ title: `Bem-vindo! ${data.tenant_name}` });
        navigate("/dashboard", { replace: true });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setValidating(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          {!imgError ? (
            <img src="/logo.png" alt="Drika Solutions" className="h-24 w-24 object-contain" onError={() => setImgError(true)} />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-bold text-primary">D</div>
          )}
          <h1 className="font-display text-3xl font-bold text-gradient-pink">DRIKA SOLUTIONS</h1>
          <p className="text-center text-muted-foreground">
            Gerencie sua loja no Discord com estilo
          </p>
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Discord Login */}
          <button
            onClick={signInWithDiscord}
            className="group flex w-full items-center justify-center gap-1 rounded-[25px] bg-gradient-to-b from-[hsl(242,65%,58%)] to-[hsl(214,55%,42%)] px-5 py-4 text-lg font-semibold text-primary-foreground shadow-[0_5px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_15px_rgba(0,0,0,0.3)] active:scale-95 active:shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
          >
            <div className="mr-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 transition-all duration-300 group-hover:bg-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-[18px] w-[18px] fill-white transition-all duration-300 group-hover:rotate-[360deg]">
                <path fill="none" d="M0 0h24v24H0z" />
                <path fill="currentColor" d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
              </svg>
            </div>
            <span>Discord</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Token Login */}
          {showTokenField ? (
            <div className="space-y-3">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole seu token de acesso..."
                  className="pl-9 bg-muted border-none h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleTokenLogin()}
                />
              </div>
              <Button
                onClick={handleTokenLogin}
                disabled={validating || !token.trim()}
                className="w-full h-12 gradient-pink text-primary-foreground border-none hover:opacity-90"
              >
                {validating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</>
                ) : (
                  "Entrar com Token"
                )}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowTokenField(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Entrar com token de acesso →
            </button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Ao entrar, você concorda com nossos Termos de Serviço
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
