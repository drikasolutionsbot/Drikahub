import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Grid3X3 } from "lucide-react";
import logo from "@/assets/logo.png";
import drikaBanner from "@/assets/drika_banner.png";

/* ── Slide data ── */
const slides = [
  // 0 — CAPA
  {
    bg: "radial-gradient(ellipse at 30% 20%, #3d0a2a 0%, #1a0610 50%, #0d0208 100%)",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 relative">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,105,180,0.3) 80px, rgba(255,105,180,0.05) 82px)'}} />
        <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(255,105,180,0.15)]">
          <img src={logo} alt="Drika" className="w-24 h-24 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-[96px] font-black tracking-tight leading-none">
            <span className="bg-gradient-to-r from-pink-400 via-pink-300 to-rose-400 bg-clip-text text-transparent">DRIKA</span>{" "}
            <span className="text-white/90">SOLUTIONS</span>
          </h1>
          <p className="text-[32px] text-white/40 font-light mt-4 tracking-[0.2em] uppercase">Sistema Completo de Bot de Loja para Discord</p>
        </div>
        <div className="flex gap-6 mt-8">
          {["SaaS Multi-Tenant", "White-Label", "100% Automatizado"].map(t => (
            <div key={t} className="px-8 py-3 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-[22px] font-medium">{t}</div>
          ))}
        </div>
        <p className="absolute bottom-16 text-white/20 text-[20px] tracking-widest uppercase">Apresentação Técnica • 2025</p>
      </div>
    ),
  },
  // 1 — VISÃO GERAL
  {
    bg: "linear-gradient(135deg, #0f0515 0%, #1a0a1e 50%, #0d0818 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-pink-400 to-pink-600" />
          <h2 className="text-[56px] font-bold text-white">Visão Geral</h2>
        </div>
        <div className="grid grid-cols-2 gap-16 flex-1">
          <div className="space-y-8">
            {[
              ["🏢", "Tipo", "SaaS Multi-Tenant White-Label"],
              ["🎯", "Foco", "Bots de loja para servidores Discord"],
              ["🤖", "Bot", "Drika Bot — Identidade global"],
              ["🔐", "Auth", "OAuth2 Discord + Token de Acesso"],
            ].map(([icon, label, value]) => (
              <div key={label} className="flex items-start gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[40px]">{icon}</span>
                <div>
                  <p className="text-pink-400 text-[22px] font-semibold mb-1">{label}</p>
                  <p className="text-white/70 text-[24px]">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-8">
            {[
              ["⚡", "Stack", "React + TypeScript + Tailwind + Supabase"],
              ["🗄️", "Backend", "Edge Functions (Deno) + PostgreSQL"],
              ["☁️", "Storage", "Supabase Storage (tenant-assets)"],
              ["📊", "Charts", "Recharts + jsPDF + xlsx"],
            ].map(([icon, label, value]) => (
              <div key={label} className="flex items-start gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[40px]">{icon}</span>
                <div>
                  <p className="text-pink-400 text-[22px] font-semibold mb-1">{label}</p>
                  <p className="text-white/70 text-[24px]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  // 2 — ARQUITETURA
  {
    bg: "linear-gradient(135deg, #0a0f1a 0%, #0d0818 50%, #0f0515 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600" />
          <h2 className="text-[56px] font-bold text-white">Arquitetura do Sistema</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-5 gap-6 w-full">
            {/* Row 1 — Clients */}
            <div className="col-span-5 flex justify-center gap-8 mb-4">
              {["Landing Page", "Painel do Cliente", "Painel Admin", "Bot Discord"].map(c => (
                <div key={c} className="px-8 py-5 rounded-2xl bg-pink-500/10 border border-pink-500/25 text-pink-300 text-[22px] font-semibold text-center min-w-[240px]">{c}</div>
              ))}
            </div>
            {/* Arrow */}
            <div className="col-span-5 flex justify-center">
              <div className="w-1 h-10 bg-gradient-to-b from-pink-500/40 to-blue-500/40" />
            </div>
            {/* Row 2 — API Layer */}
            <div className="col-span-5 flex justify-center">
              <div className="px-16 py-6 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[26px] font-bold text-center">
                40+ Edge Functions (Deno) — Service Role
              </div>
            </div>
            {/* Arrow */}
            <div className="col-span-5 flex justify-center">
              <div className="w-1 h-10 bg-gradient-to-b from-blue-500/40 to-emerald-500/40" />
            </div>
            {/* Row 3 — Data Layer */}
            <div className="col-span-5 flex justify-center gap-8">
              {[
                ["PostgreSQL", "26+ Tabelas com RLS", "emerald"],
                ["Supabase Auth", "Discord OAuth2", "amber"],
                ["Storage", "tenant-assets (público)", "cyan"],
                ["Discord API v10", "Bot + Webhooks", "violet"],
              ].map(([title, desc, color]) => (
                <div key={title} className={`px-8 py-5 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 text-center min-w-[240px]`}>
                  <p className={`text-${color}-300 text-[22px] font-semibold`}>{title}</p>
                  <p className="text-white/40 text-[18px] mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  // 3 — MÓDULOS PARTE 1
  {
    bg: "linear-gradient(135deg, #0f0515 0%, #1a0a1e 50%, #0d0818 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-pink-400 to-pink-600" />
          <h2 className="text-[56px] font-bold text-white">Módulos do Painel <span className="text-white/40 text-[36px] ml-4">1/2</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
          {[
            ["🏠", "Visão Geral", "KPIs em tempo real, gráficos de vendas (7/30 dias), troca dinâmica de servidor Discord, busca de membros"],
            ["💰", "Finanças", "Histórico de pedidos com filtros, wallet com saldo/ganhos/saques, detalhes por provedor de pagamento"],
            ["✅", "Aprovações", "Fila de pedidos PIX estático, aprovação/rejeição com notificação automática no Discord"],
            ["🎨", "Personalização", "Embed Builder visual com preview em tempo real, salvamento e reutilização, envio direto para canais"],
            ["📦", "Recursos", "Comandos do bot, módulos on/off, cargos sincronizados com Discord API v10"],
            ["#️⃣", "Canais", "Mapeamento por categoria (Sistema, Loja, Membros, Moderação), criação direta, save em lote"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[36px]">{icon}</span>
                <h3 className="text-[26px] font-bold text-white">{title}</h3>
              </div>
              <p className="text-white/50 text-[20px] leading-relaxed flex-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 4 — MÓDULOS PARTE 2
  {
    bg: "linear-gradient(135deg, #0f0515 0%, #1a0a1e 50%, #0d0818 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-pink-400 to-pink-600" />
          <h2 className="text-[56px] font-bold text-white">Módulos do Painel <span className="text-white/40 text-[36px] ml-4">2/2</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
          {[
            ["🛡️", "Cargos", "Cargos com permissões granulares (10+ flags), sincronização bidirecional com Discord"],
            ["🔒", "Proteção", "Anti-raid configurável, whitelist de IDs/cargos, logs de ações em tempo real"],
            ["🎫", "Tickets", "Tickets abertos/fechados vinculados a pedidos, status open/closed/waiting"],
            ["☁️", "eCloud", "Gráficos de infraestrutura, URL customizada por tenant, monitoramento de uso"],
            ["🎧", "Suporte", "Canais de suporte configuráveis, status online/offline, links de contato direto"],
            ["⚙️", "Configurações", "Branding, Bot, PIX, Pagamentos, Verificação, Equipe, Contato"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[36px]">{icon}</span>
                <h3 className="text-[26px] font-bold text-white">{title}</h3>
              </div>
              <p className="text-white/50 text-[20px] leading-relaxed flex-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 5 — LOJA DETALHADA
  {
    bg: "linear-gradient(135deg, #0d0818 0%, #1a0610 50%, #0f0515 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-amber-400 to-orange-600" />
          <h2 className="text-[56px] font-bold text-white">Módulo de Loja</h2>
          <span className="text-[28px] text-white/30 ml-4">Sistema completo de e-commerce no Discord</span>
        </div>
        <div className="grid grid-cols-2 gap-8 flex-1">
          <div className="space-y-5">
            <h3 className="text-pink-400 text-[28px] font-bold mb-4">Produtos</h3>
            {[
              "CRUD completo com master-detail",
              "Tipos: digital auto, digital manual, físico",
              "Preço + preço promocional (compare_price)",
              "Categorias, ícone, banner",
              "Toggles: ativo, entrega automática, estoque, vendidos, créditos",
              "Preview Discord em tempo real",
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-white/60 text-[22px]">
                <div className="w-2 h-2 rounded-full bg-pink-500/60 shrink-0" />
                {t}
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <h3 className="text-amber-400 text-[28px] font-bold mb-4">Sub-sistemas</h3>
            {[
              ["Variações", "Preço, estoque e visual independentes, emojis, reordenação, restrição por cargo"],
              ["Estoque", "Itens de texto, adição em massa, controle de entrega com destinatário"],
              ["Cupons", "% ou valor fixo, global ou por produto, limite de usos, expiração"],
              ["Hooks", "Ações pós-compra: add/remove role, send message, webhook"],
            ].map(([title, desc]) => (
              <div key={title} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-amber-300 text-[22px] font-semibold mb-1">{title}</p>
                <p className="text-white/40 text-[19px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  // 6 — PAGAMENTOS
  {
    bg: "linear-gradient(135deg, #0a1a0f 0%, #0d180a 50%, #0f1508 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-emerald-400 to-green-600" />
          <h2 className="text-[56px] font-bold text-white">Sistema de Pagamentos</h2>
        </div>
        <div className="grid grid-cols-2 gap-12 flex-1">
          <div>
            <h3 className="text-emerald-400 text-[30px] font-bold mb-8">4 Gateways Suportados</h3>
            <div className="space-y-5">
              {[
                ["💙", "Mercado Pago", "PIX dinâmico via API, Access Token"],
                ["🧡", "PushinPay", "PIX dinâmico, token de produção"],
                ["💚", "Efí (Gerencianet)", "PIX via Client ID + Secret"],
                ["💜", "Mistic Pay", "PIX dinâmico, API Token"],
              ].map(([icon, name, desc]) => (
                <div key={name} className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[32px]">{icon}</span>
                  <div>
                    <p className="text-white text-[24px] font-semibold">{name}</p>
                    <p className="text-white/40 text-[18px]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-emerald-400 text-[30px] font-bold mb-8">Fluxo Completo</h3>
            <div className="space-y-4">
              {[
                ["1", "Cliente configura sua API Key no painel"],
                ["2", "Comprador clica Comprar no Discord"],
                ["3", "Edge Function gera PIX dinâmico via gateway do tenant"],
                ["4", "QR Code exibido no Discord com timeout"],
                ["5", "Webhook confirma pagamento automaticamente"],
                ["6", "Estoque entregue + hooks executados"],
                ["7", "Cron cancela pedidos expirados (5 min)"],
              ].map(([num, text]) => (
                <div key={num} className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[20px] font-bold shrink-0">{num}</div>
                  <p className="text-white/60 text-[22px]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  // 7 — DISCORD INTEGRATION
  {
    bg: "linear-gradient(135deg, #0a0f1e 0%, #0f0a22 50%, #0a0818 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-indigo-400 to-violet-600" />
          <h2 className="text-[56px] font-bold text-white">Integração Discord</h2>
        </div>
        <div className="grid grid-cols-2 gap-12 flex-1">
          <div className="space-y-6">
            <h3 className="text-indigo-400 text-[30px] font-bold mb-4">Bot API</h3>
            {[
              ["API v10", "Comunicação direta com Discord API"],
              ["Permissão 536870920", "Administrador + Gerenciar Webhooks"],
              ["/painel", "Comando slash com embeds interativos"],
              ["Botões", "Comprar, Variações, Detalhes — componentes nativos"],
              ["Sync", "Canais, cargos, membros, emojis em tempo real"],
              ["Multi-Guild", "Troca dinâmica de servidor por tenant"],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-start gap-4">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[18px] font-mono shrink-0">{label}</span>
                <p className="text-white/50 text-[22px]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <h3 className="text-violet-400 text-[30px] font-bold mb-4">Verificação de Membros</h3>
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-5">
              {[
                "OAuth2 com backup de cargos (roles_backup)",
                "Token de acesso + refresh token criptografados",
                "Restauração automática de cargos",
                "Nickname e avatar sincronizados",
                "Configurável: cargo verificado, URL redirect",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-white/60 text-[22px]">
                  <div className="w-2 h-2 rounded-full bg-violet-500/60 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
            <h3 className="text-violet-400 text-[30px] font-bold mt-8 mb-4">Mensagens</h3>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-white/50 text-[22px]">Produtos enviados via <span className="text-violet-300 font-semibold">Bot API</span> (não Webhook) para suportar componentes interativos como botões de compra</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  // 8 — ADMIN PANEL
  {
    bg: "linear-gradient(135deg, #1a0a08 0%, #1e0a0a 50%, #180808 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-red-400 to-rose-600" />
          <h2 className="text-[56px] font-bold text-white">Painel Administrativo</h2>
          <span className="text-[24px] text-white/30 ml-4">Super Admin — Gestão do SaaS</span>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
          {[
            ["📊", "Dashboard", "KPIs globais de receita, clientes ativos, crescimento mensal, gráfico de distribuição de planos"],
            ["👥", "Clientes", "CRUD de tenants, edição inline de planos (Free/Starter/Pro/Business), busca por email ou ID"],
            ["💳", "Assinaturas", "Pagamentos de planos SaaS via PushinPay, histórico completo com status"],
            ["🔌", "Integração", "API Key PushinPay, auto-ativação após pagamento, suspensão ao expirar"],
            ["📋", "Audit Logs", "Registro completo de todas as ações administrativas com detalhes"],
            ["🌐", "Landing Config", "Estatísticas editáveis, URL de vídeo, preço do plano Pro"],
            ["📤", "Exportação", "Excel e PDF dos dados de clientes com formatação profissional"],
            ["🗑️", "Exclusão", "Cascade delete seguro (30+ tabelas) com confirmação"],
            ["🔔", "Notificações", "Alertas em tempo real para novas lojas e ativações de plano Pro"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[30px]">{icon}</span>
                <h3 className="text-[24px] font-bold text-white">{title}</h3>
              </div>
              <p className="text-white/45 text-[19px] leading-relaxed flex-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 9 — SEGURANÇA
  {
    bg: "linear-gradient(135deg, #0a1a0a 0%, #0d1a0d 50%, #081808 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600" />
          <h2 className="text-[56px] font-bold text-white">Segurança</h2>
        </div>
        <div className="grid grid-cols-2 gap-12 flex-1 items-center">
          <div className="space-y-7">
            {[
              ["🔐", "Row-Level Security", "RLS ativo em todas as 26+ tabelas com policies por role"],
              ["🏗️", "Isolamento Multi-Tenant", "Todas as operações filtradas por tenant_id"],
              ["🔑", "Service Role", "Edge Functions operam com service_role para bypass seguro"],
              ["🎭", "Credenciais Mascaradas", "API Keys nunca exibidas integralmente no frontend"],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[36px]">{icon}</span>
                <div>
                  <p className="text-emerald-400 text-[24px] font-semibold">{title}</p>
                  <p className="text-white/50 text-[20px] mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-7">
            {[
              ["🎟️", "Tokens de Acesso", "Expiração configurável, revogação instantânea, whitelist de IP"],
              ["🛡️", "SECURITY DEFINER", "Funções SQL seguras para verificação de roles sem recursão"],
              ["🚫", "Anti-Injection", "Sem SQL raw — apenas APIs tipadas com parâmetros validados"],
              ["📝", "Audit Logs", "Registro completo de ações admin com timestamp e detalhes"],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[36px]">{icon}</span>
                <div>
                  <p className="text-teal-400 text-[24px] font-semibold">{title}</p>
                  <p className="text-white/50 text-[20px] mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  // 10 — BANCO DE DADOS
  {
    bg: "linear-gradient(135deg, #0f0a1a 0%, #0a0f1e 50%, #0d0818 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
          <h2 className="text-[56px] font-bold text-white">Banco de Dados</h2>
          <span className="text-[28px] text-white/30 ml-4">PostgreSQL — 26+ Tabelas</span>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1 content-start">
          {[
            { cat: "Core", color: "pink", tables: ["tenants", "profiles", "user_roles", "access_tokens"] },
            { cat: "Loja", color: "amber", tables: ["products", "product_fields", "product_stock_items", "product_hooks", "categories", "orders", "coupons"] },
            { cat: "Pagamentos", color: "emerald", tables: ["payment_providers", "store_configs", "wallet_transactions", "wallets", "webhook_logs"] },
            { cat: "Discord", color: "indigo", tables: ["channel_configs", "tenant_permissions", "tenant_roles", "verified_members", "saved_embeds"] },
            { cat: "Módulos", color: "violet", tables: ["automations", "automation_logs", "protection_settings", "protection_logs", "protection_whitelist"] },
            { cat: "Social", color: "cyan", tables: ["tickets", "giveaways", "giveaway_entries", "vip_plans", "vip_members", "affiliates"] },
            { cat: "Admin", color: "rose", tables: ["admin_audit_logs", "landing_config", "subscription_payments", "support_channels"] },
          ].map(({ cat, color, tables }) => (
            <div key={cat} className={`p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] ${tables.length > 5 ? "col-span-2" : ""}`}>
              <p className={`text-${color}-400 text-[20px] font-bold mb-3`}>{cat}</p>
              <div className="flex flex-wrap gap-2">
                {tables.map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-[16px] font-mono">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 11 — EDGE FUNCTIONS
  {
    bg: "linear-gradient(135deg, #1a0a08 0%, #0d0818 50%, #0a0f1a 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-orange-400 to-red-600" />
          <h2 className="text-[56px] font-bold text-white">Edge Functions</h2>
          <span className="text-[28px] text-white/30 ml-4">40+ Funções Serverless (Deno)</span>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1 content-start">
          {[
            { cat: "Loja", funcs: ["manage-products", "manage-categories", "manage-product-fields", "manage-product-hooks", "manage-store-config", "manage-coupons"] },
            { cat: "Pagamentos", funcs: ["generate-pix", "payment-webhook", "test-payment", "manage-payment-providers", "generate-subscription-pix", "subscription-webhook"] },
            { cat: "Discord", funcs: ["discord-channels", "discord-guilds", "discord-bot-guilds", "discord-guild-info", "discord-guild-members", "discord-guild-emojis", "discord-interactions", "create-discord-channel"] },
            { cat: "Gestão", funcs: ["manage-roles", "manage-permissions", "manage-channel-configs", "manage-channel-permissions", "manage-automations", "execute-automation", "manage-vips", "manage-giveaways", "manage-welcome", "manage-protection"] },
            { cat: "Tenant", funcs: ["create-tenant", "get-tenant", "update-tenant", "delete-tenant", "register-client"] },
            { cat: "Sistema", funcs: ["validate-token", "register-commands", "deliver-order", "expire-pending-orders", "check-expired-plans", "check-expired-vips", "send-log-message", "send-webhook-message"] },
          ].map(({ cat, funcs }) => (
            <div key={cat} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-orange-400 text-[22px] font-bold mb-3">{cat}</p>
              <div className="space-y-1.5">
                {funcs.map(f => (
                  <p key={f} className="text-white/40 text-[17px] font-mono">• {f}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 12 — PLANOS
  {
    bg: "linear-gradient(135deg, #1a0a18 0%, #0d0818 50%, #180a1a 100%)",
    content: (
      <div className="flex flex-col h-full p-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-3 h-12 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600" />
          <h2 className="text-[56px] font-bold text-white">Planos do SaaS</h2>
        </div>
        <div className="grid grid-cols-4 gap-8 flex-1 items-start">
          {[
            { name: "Free", price: "R$ 0", color: "white/40", features: ["1 produto", "PIX estático", "Funcionalidades básicas", "Suporte comunidade"] },
            { name: "Starter", price: "R$ 19,90", color: "blue-400", features: ["Produtos ilimitados", "Gateways de pagamento", "Cupons e categorias", "Suporte email"] },
            { name: "Pro", price: "R$ 29,90", color: "pink-400", features: ["Todos os recursos", "Proteção anti-raid", "eCloud", "Automações", "Hooks pós-compra", "Suporte prioritário"], popular: true },
            { name: "Business", price: "R$ 59,90", color: "amber-400", features: ["White-label completo", "API dedicada", "Multi-servidor", "Suporte VIP", "Relatórios avançados"] },
          ].map(({ name, price, color, features, popular }) => (
            <div key={name} className={`p-8 rounded-2xl border flex flex-col ${popular ? "bg-pink-500/10 border-pink-500/30 scale-105 shadow-[0_0_40px_rgba(255,105,180,0.1)]" : "bg-white/[0.03] border-white/[0.06]"}`}>
              {popular && <span className="text-[16px] font-bold text-pink-400 uppercase tracking-widest mb-4">Mais Popular</span>}
              <h3 className={`text-${color} text-[32px] font-bold`}>{name}</h3>
              <p className="text-white text-[42px] font-black mt-2">{price}<span className="text-white/30 text-[20px] font-normal">/mês</span></p>
              <div className="mt-8 space-y-4 flex-1">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/50 text-[20px]">
                    <div className={`w-2 h-2 rounded-full ${popular ? "bg-pink-500/60" : "bg-white/20"} shrink-0`} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 13 — ENCERRAMENTO
  {
    bg: "radial-gradient(ellipse at 50% 50%, #3d0a2a 0%, #1a0610 50%, #0d0208 100%)",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-10 relative">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,105,180,0.3) 80px, rgba(255,105,180,0.05) 82px)'}} />
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 flex items-center justify-center">
          <img src={logo} alt="Drika" className="w-20 h-20 object-contain" />
        </div>
        <h2 className="text-[72px] font-black text-white text-center leading-tight">
          Pronto para <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">revolucionar</span><br />
          suas vendas no Discord?
        </h2>
        <p className="text-white/40 text-[28px] max-w-[800px] text-center">
          DRIKA SOLUTIONS — O sistema mais completo de bot de loja para servidores Discord
        </p>
        <div className="flex gap-6 mt-6">
          {["40+ Edge Functions", "26+ Tabelas", "4 Gateways PIX", "13 Módulos"].map(t => (
            <div key={t} className="px-8 py-4 rounded-2xl border border-pink-500/20 bg-pink-500/10 text-pink-300 text-[24px] font-semibold">{t}</div>
          ))}
        </div>
        <p className="absolute bottom-16 text-white/20 text-[20px]">drikasolutions.com • 2025</p>
      </div>
    ),
  },
];

/* ── Presentation Component ── */
const PresentationPage = () => {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / 1920;
    const scaleY = rect.height / 1080;
    setScale(Math.min(scaleX, scaleY));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale, isFullscreen, showGrid]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showGrid) {
        if (e.key === "Escape" || e.key === "g") setShowGrid(false);
        return;
      }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrent(c => Math.min(c + 1, slides.length - 1)); }
      if (e.key === "ArrowLeft") setCurrent(c => Math.max(c - 1, 0));
      if (e.key === "Escape") { if (isFullscreen) document.exitFullscreen(); }
      if (e.key === "f" || e.key === "F5") { e.preventDefault(); toggleFullscreen(); }
      if (e.key === "g") setShowGrid(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen, showGrid]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  const slide = slides[current];

  if (showGrid) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] z-50 overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Todos os Slides ({slides.length})</h2>
          <button onClick={() => setShowGrid(false)} className="text-white/50 hover:text-white px-4 py-2 rounded-lg bg-white/10">Fechar (G)</button>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setShowGrid(false); }}
              className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${i === current ? "border-pink-500 shadow-[0_0_20px_rgba(255,105,180,0.3)]" : "border-white/10 hover:border-white/30"}`}
            >
              <div className="aspect-video relative overflow-hidden" style={{ background: s.bg }}>
                <div style={{ transform: "scale(0.18)", transformOrigin: "top left", width: 1920, height: 1080, pointerEvents: "none" }}>
                  {s.content}
                </div>
              </div>
              <div className="absolute bottom-2 left-3 bg-black/60 px-2 py-0.5 rounded text-white/70 text-xs font-mono">{i + 1}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col select-none" ref={containerRef}>
      {/* Toolbar */}
      {!isFullscreen && (
        <div className="h-12 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Drika" className="w-6 h-6" />
            <span className="text-white/70 text-sm font-semibold">DRIKA SOLUTIONS — Apresentação</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGrid(true)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Grid (G)">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Tela cheia (F)">
              <Maximize2 className="w-4 h-4" />
            </button>
            <span className="text-white/30 text-xs font-mono ml-2">{current + 1}/{slides.length}</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute"
          style={{
            width: 1920,
            height: 1080,
            left: "50%",
            top: "50%",
            marginLeft: -960,
            marginTop: -540,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            background: slide.bg,
            borderRadius: isFullscreen ? 0 : 12,
            overflow: "hidden",
          }}
        >
          {slide.content}
        </div>

        {/* Nav arrows */}
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all z-10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {current < slides.length - 1 && (
          <button onClick={() => setCurrent(c => c + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all z-10">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      {!isFullscreen && (
        <div className="h-10 bg-[#111] border-t border-white/10 flex items-center justify-center gap-2 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-pink-500 w-6" : "bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PresentationPage;
