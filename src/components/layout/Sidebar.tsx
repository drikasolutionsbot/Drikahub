import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, Palette, Box, Hash, ShieldCheck, HandMetal,
  Store, Zap, Shield, Link2, Gift, Crown, Ticket, Cloud, Headset, Settings,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Visão Geral", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Finanças", icon: DollarSign, path: "/finance" },
  { label: "Personalização", icon: Palette, path: "/customization" },
  { label: "Recursos", icon: Box, path: "/resources" },
  { label: "Canais", icon: Hash, path: "/channels" },
  { label: "Cargos", icon: ShieldCheck, path: "/roles" },
  { label: "Boas Vindas", icon: HandMetal, path: "/welcome" },
  { label: "Loja", icon: Store, path: "/store" },
  { label: "Ações Automáticas", icon: Zap, path: "/automations" },
  { label: "Proteção", icon: Shield, path: "/protection" },
  { label: "Rastreamento", icon: Link2, path: "/invite-tracking" },
  { label: "Sorteios", icon: Gift, path: "/giveaways" },
  { label: "VIPs", icon: Crown, path: "/vips" },
  { label: "Tickets", icon: Ticket, path: "/tickets" },
  { label: "eCloud", icon: Cloud, path: "/ecloud" },
];

const bottomItems = [
  { label: "Suporte", icon: Headset, path: "/support" },
  { label: "Configurações", icon: Settings, path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="flex flex-col items-center w-[72px] shrink-0 py-3 gap-2 bg-card border-r border-border">
        {/* Logo */}
        <Link to="/dashboard" className="mb-2 group">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-muted transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
            <img src={logo} alt="Drika" className="h-7 w-7 object-contain" />
          </div>
        </Link>

        {/* Separator */}
        <div className="w-8 h-px bg-border mb-1" />

        {/* Main nav */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto scrollbar-none w-full px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group",
                      isActive
                        ? "bg-primary/15 shadow-sm"
                        : "hover:bg-muted"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[14px] w-1 h-5 rounded-r-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive
                          ? "text-primary scale-110"
                          : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                      )}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="w-8 h-px bg-border mt-1" />

        {/* Bottom items */}
        <div className="flex flex-col items-center gap-0.5 px-2">
          {bottomItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group",
                      isActive
                        ? "bg-primary/15 shadow-sm"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[14px] w-1 h-5 rounded-r-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive
                          ? "text-primary scale-110"
                          : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                      )}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
};
