import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, Palette, Box, Hash, ShieldCheck, HandMetal,
  Store, Zap, Shield, Link2, Gift, Crown, Ticket, Cloud, Headset, Settings,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTenant } from "@/contexts/TenantContext";

const navGroups = [
  {
    label: "PRINCIPAL",
    items: [
      { label: "Visão Geral", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    label: "GERENCIAMENTO",
    items: [
      { label: "Finanças", icon: DollarSign, path: "/finance" },
      { label: "Personalização", icon: Palette, path: "/customization" },
      { label: "Recursos", icon: Box, path: "/resources" },
    ],
  },
  {
    label: "CONFIGURAÇÕES",
    items: [
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
    ],
  },
];

const bottomItems = [
  { label: "Suporte", icon: Headset, path: "/support" },
  { label: "Configurações", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { tenant } = useTenant();

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "flex flex-col shrink-0 bg-card border-r border-border transition-all duration-300",
          collapsed ? "w-[72px] items-center" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-border transition-all duration-300",
          collapsed ? "justify-center py-3 px-2 h-auto" : "gap-3 px-4 py-3"
        )}>
          <Link to="/dashboard" className="group shrink-0">
            <div className={cn(
              "flex items-center justify-center rounded-2xl bg-muted transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20",
              collapsed ? "h-12 w-12" : "h-9 w-9"
            )}>
              <img src={logo} alt="Drika" className={cn("object-contain", collapsed ? "h-7 w-7" : "h-6 w-6")} />
            </div>
          </Link>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display text-lg font-bold leading-tight">
                <span className="text-gradient-pink">DRIKA</span>{" "}
                <span className="text-foreground">SOLUTIONS</span>
              </span>
              {tenant?.discord_guild_id && (
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                  {tenant.discord_guild_id}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto scrollbar-none py-2",
          collapsed ? "px-2 space-y-0.5" : "px-2 space-y-4"
        )}>
          {collapsed ? (
            /* Collapsed: icon-only with tooltips */
            <>
              {navGroups.flatMap(g => g.items).map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group mx-auto",
                          isActive ? "bg-primary/15 shadow-sm" : "hover:bg-muted"
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
            </>
          ) : (
            /* Expanded: grouped with labels */
            navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group",
                          isActive
                            ? "bg-primary/15 text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-all duration-300",
                            isActive
                              ? "text-primary scale-110"
                              : "group-hover:text-primary group-hover:scale-110"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Bottom section */}
        {collapsed && <div className="w-8 h-px bg-border mx-auto" />}

        <div className={cn(
          "py-2",
          collapsed ? "px-2 space-y-0.5" : "px-2 space-y-0.5"
        )}>
          {bottomItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return collapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group mx-auto",
                      isActive ? "bg-primary/15 shadow-sm" : "hover:bg-muted"
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
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-300",
                    isActive
                      ? "text-primary scale-110"
                      : "group-hover:text-primary group-hover:scale-110"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center h-12 border-t border-border text-muted-foreground hover:text-primary transition-all duration-300 group",
            collapsed ? "w-full" : "w-full"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:scale-125" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:scale-125" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
};
