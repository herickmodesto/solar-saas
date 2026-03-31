"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebar } from "@/context/SidebarContext";

// ── Nav items ────────────────────────────────────────────────────
const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,10V22H4a2,2,0,0,1-2-2V10Z" />
        <path d="M22,10V20a2,2,0,0,1-2,2H16V10Z" />
        <path d="M22,4V8H2V4A2,2,0,0,1,4,2H20A2,2,0,0,1,22,4Z" />
      </svg>
    ),
  },
  {
    href: "/proposta",
    label: "Propostas",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
  },
  {
    href: "/calculadora",
    label: "Calculadora",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
  },
  {
    href: "/upload-fatura",
    label: "Upload Faturas",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    href: "/analise-mensal",
    label: "Análise Mensal",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

// ── Notifications ─────────────────────────────────────────────────
const NOTIFICACOES = [
  { id: 1, tipo: "success", msg: "Nova proposta gerada com sucesso.", hora: "há 5 min", lida: false },
  { id: 2, tipo: "info",    msg: "Aluguel de setembro calculado — R$11.534,19.", hora: "há 1h",  lida: false },
  { id: 3, tipo: "warning", msg: "Tarifas ANEEL foram atualizadas. Revise os cálculos.", hora: "há 2h", lida: false },
  { id: 4, tipo: "error",   msg: "Falha ao exportar relatório mensal. Tente novamente.", hora: "Ontem", lida: true },
];

const NOTIF_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-green-50 hover:bg-green-100",   border: "border-green-400",  text: "text-green-900",  icon: "text-green-500"  },
  info:    { bg: "bg-blue-50 hover:bg-blue-100",     border: "border-blue-400",   text: "text-blue-900",   icon: "text-blue-500"   },
  warning: { bg: "bg-yellow-50 hover:bg-yellow-100", border: "border-yellow-400", text: "text-yellow-900", icon: "text-yellow-500" },
  error:   { bg: "bg-red-50 hover:bg-red-100",       border: "border-red-400",    text: "text-red-900",    icon: "text-red-500"    },
};

interface DashStats { proposals: number; calculations: number; clients: number; totalRent: number; }
interface SubInfo   { plan: string; status: string; rawStatus: string; endsAt: string | null; }

// ── Sidebar ───────────────────────────────────────────────────────
function AppSidebar({
  userInitial, userName, userEmail,
  planLabel, endsAtLabel, isTrialOrActive,
  onLogout,
}: {
  userInitial: string; userName: string; userEmail: string;
  planLabel: string; endsAtLabel: string; isTrialOrActive: boolean;
  onLogout: () => void;
}) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const visible = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-white border-r transition-all duration-300 ease-in-out
          ${visible ? "w-[280px]" : "w-[88px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ borderColor: "#D2C1B6" }}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 px-5 border-b flex-shrink-0 ${visible ? "justify-start gap-3" : "justify-center"}`}
          style={{ borderColor: "#D2C1B6" }}
        >
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-xl flex-shrink-0">☀️</div>
          {visible && (
            <span className="text-lg font-extrabold text-[#1B3C53] whitespace-nowrap overflow-hidden">SolarPro</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-5">
          <div className={`mb-3 px-2 ${visible ? "" : "text-center"}`}>
            {visible
              ? <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Menu</span>
              : <span className="block w-4 h-px bg-gray-200 mx-auto" />
            }
          </div>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${!visible ? "lg:justify-center" : ""}`}
                    title={!visible ? item.label : undefined}
                  >
                    {active && (
                      <span className="absolute left-0 top-[10%] w-[3px] h-[80%] rounded-r-full bg-[#1B3C53]" />
                    )}
                    <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                      {item.icon}
                    </span>
                    {visible && <span className="menu-item-text">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: subscription card + settings/logout */}
        <div className="px-3 pb-5 flex-shrink-0 space-y-2" style={{ borderTop: "1px solid #D2C1B6" }}>
          {visible ? (
            /* Full subscription card */
            <div className="mt-3 rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1B3C53 0%, #456882 100%)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-[#1B3C53] font-extrabold text-sm flex-shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight">{userName}</p>
                  <p className="text-xs truncate" style={{ color: "#D2C1B6" }}>{userEmail}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div>
                  <p className="text-[10px]" style={{ color: "#D2C1B6" }}>Assinatura</p>
                  <p className="text-sm font-bold text-yellow-400">{planLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px]" style={{ color: "#D2C1B6" }}>{isTrialOrActive ? "Válido até" : "Status"}</p>
                  <p className="text-xs font-semibold text-white">{isTrialOrActive ? endsAtLabel : "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed: just avatar */
            <div className="flex justify-center pt-3">
              <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-[#1B3C53] font-extrabold text-sm">
                {userInitial}
              </div>
            </div>
          )}

          {/* Settings + logout */}
          <div className="flex flex-col gap-1">
            <Link
              href="/configuracoes"
              className={`menu-item group menu-item-inactive ${!visible ? "lg:justify-center" : ""}`}
              title={!visible ? "Configurações" : undefined}
            >
              <span className="menu-item-icon-inactive w-5 h-5 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </span>
              {visible && <span className="menu-item-text">Configurações</span>}
            </Link>

            <button
              onClick={onLogout}
              title={!visible ? "Sair" : undefined}
              className={`menu-item group w-full text-left text-red-500 hover:bg-red-50 ${!visible ? "lg:justify-center" : ""}`}
            >
              <span className="w-5 h-5 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
              </span>
              {visible && <span className="menu-item-text">Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────
function AppHeader({
  userName, userEmail, userInitial, planLabel,
  notifOpen, setNotifOpen, notifs, naoLidas, marcarLida, marcarTodas,
  userMenuOpen, setUserMenuOpen,
  onLogout,
}: {
  userName: string; userEmail: string; userInitial: string; planLabel: string;
  notifOpen: boolean; setNotifOpen: (v: boolean) => void;
  notifs: typeof NOTIFICACOES; naoLidas: number;
  marcarLida: (id: number) => void; marcarTodas: () => void;
  userMenuOpen: boolean; setUserMenuOpen: (v: boolean) => void;
  onLogout: () => void;
}) {
  const { isExpanded, isHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b" style={{ borderColor: "#D2C1B6" }}>
      {/* Left: toggle + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-[#F9F3EF] transition-colors"
          style={{ borderColor: "#D2C1B6" }}
          aria-label="Toggle sidebar"
        >
          {isExpanded || isHovered ? (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"/>
            </svg>
          )}
        </button>
        <h1 className="text-base font-bold text-[#1B3C53] hidden sm:block">Dashboard</h1>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-10 h-10 flex items-center justify-center rounded-lg border hover:bg-[#F9F3EF] transition-colors text-gray-500"
            style={{ borderColor: "#D2C1B6" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {naoLidas}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border z-50" style={{ borderColor: "#D2C1B6" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#D2C1B6" }}>
                  <span className="font-bold text-[#1B3C53] text-sm">Notificações</span>
                  <button onClick={marcarTodas} className="text-xs text-[#456882] hover:text-[#1B3C53] font-medium transition-colors">
                    Marcar todas como lidas
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto p-3 space-y-2">
                  {notifs.map((n) => {
                    const s = NOTIF_STYLES[n.tipo] ?? NOTIF_STYLES.info;
                    return (
                      <div
                        key={n.id}
                        onClick={() => marcarLida(n.id)}
                        className={`${s.bg} ${s.text} border-l-4 ${s.border} p-2.5 rounded-lg flex items-start gap-2 cursor-pointer transition-all duration-200 ${n.lida ? "opacity-50" : ""}`}
                      >
                        <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" className={`h-4 w-4 flex-shrink-0 mt-0.5 ${s.icon}`}>
                          <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight">{n.msg}</p>
                          <p className="text-xs opacity-60 mt-0.5">{n.hora}</p>
                        </div>
                        {!n.lida && <div className="w-2 h-2 rounded-full bg-current opacity-70 flex-shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-[#F9F3EF] transition-colors"
            style={{ borderColor: "#D2C1B6" }}
          >
            <div className="w-7 h-7 rounded-full bg-[#1B3C53] flex items-center justify-center text-white font-bold text-xs">
              {userInitial}
            </div>
            <span className="text-sm font-medium text-[#1B3C53] hidden sm:block max-w-[100px] truncate">{userName}</span>
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#0D1117] rounded-xl shadow-2xl overflow-hidden border border-white/10 z-50">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-white text-xs font-semibold truncate">{userName}</p>
                  <p className="text-gray-400 text-[11px] truncate">{userEmail}</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">{planLabel}</p>
                </div>
                <div className="py-1 flex flex-col">
                  {[
                    { label: "Configurações", href: "/configuracoes" },
                    { label: "Perfil",        href: "/configuracoes" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className="px-4 py-2.5 text-white text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout(); }}
                    className="px-4 py-2.5 text-red-400 text-sm hover:bg-white/5 transition-colors w-full text-left flex items-center gap-2"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────
export default function Dashboard() {
  const { data: session } = useSession();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifs,       setNotifs]       = useState(NOTIFICACOES);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [sub,          setSub]          = useState<SubInfo | null>(null);
  const [dashStats,    setDashStats]    = useState<DashStats | null>(null);

  const naoLidas = notifs.filter(n => !n.lida).length;

  useEffect(() => {
    fetch("/api/me/subscription").then(r => r.json()).then(setSub).catch(() => {});
    fetch("/api/me/stats").then(r => r.json()).then(setDashStats).catch(() => {});
  }, []);

  const userName       = session?.user?.name  ?? "Usuário";
  const userEmail      = session?.user?.email ?? "";
  const userInitial    = userName.charAt(0).toUpperCase();
  const planLabel      = sub?.plan ?? "—";
  const endsAtLabel    = sub?.endsAt ? new Date(sub.endsAt).toLocaleDateString("pt-BR") : "—";
  const isTrialOrActive = sub?.rawStatus === "TRIAL" || sub?.rawStatus === "ACTIVE";

  const marcarLida  = (id: number) => setNotifs(notifs.map(n => n.id === id ? { ...n, lida: true } : n));
  const marcarTodas = () => setNotifs(notifs.map(n => ({ ...n, lida: true })));

  // Sidebar margin logic
  const visible = isExpanded || isHovered || isMobileOpen;
  const mainMargin = isMobileOpen ? "ml-0" : visible ? "lg:ml-[280px]" : "lg:ml-[88px]";

  const stats = [
    { label: "Propostas geradas",  value: dashStats ? String(dashStats.proposals)  : "…", icon: "📄", bg: "#EEF4FA", text: "#1B3C53"  },
    { label: "Cálculos realizados",value: dashStats ? String(dashStats.calculations): "…", icon: "🔢", bg: "#FDF6E3", text: "#92610A"  },
    { label: "Clientes ativos",    value: dashStats ? String(dashStats.clients)     : "…", icon: "👥", bg: "#EDFAF3", text: "#155E3D"  },
    {
      label: "Total aluguel/mês",
      value: dashStats
        ? dashStats.totalRent.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
        : "…",
      icon: "💰", bg: "#F9F3EF", text: "#6B3E1E",
    },
  ];

  const tools = [
    { href: "/proposta",      icon: "📄", title: "Gerar Proposta",    desc: "Crie propostas profissionais em PDF.",                    accent: "#1B3C53" },
    { href: "/calculadora",   icon: "🔢", title: "Calcular Aluguel",  desc: "Calcule o valor mensal do aluguel de usinas.",            accent: "#456882" },
    { href: "/analise-mensal",icon: "📊", title: "Análise Mensal",    desc: "Relatório de vendas de energia para seu cliente.",        accent: "#D2C1B6" },
    { href: "/upload-fatura", icon: "📁", title: "Upload de Faturas", desc: "Envie arquivos de fatura (PDF, imagens) para análise.",   accent: "#8BA5B5" },
  ];

  const activity = [
    { icon: "📄", text: "Proposta #708762 gerada",                          time: "há 2h",     color: "#1B3C53" },
    { icon: "🔢", text: "Aluguel de setembro calculado — R$11.534,19",       time: "há 4h",     color: "#456882" },
    { icon: "📊", text: "Análise mensal Ago/2025 exportada",                 time: "Ontem",     color: "#5c8a6a" },
    { icon: "📄", text: "Proposta #708750 gerada",                          time: "2 dias atrás", color: "#1B3C53" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F9F3EF" }}>
      {/* Sidebar */}
      <AppSidebar
        userInitial={userInitial}
        userName={userName}
        userEmail={userEmail}
        planLabel={planLabel}
        endsAtLabel={endsAtLabel}
        isTrialOrActive={isTrialOrActive}
        onLogout={() => setLogoutConfirm(true)}
      />

      {/* Main area */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainMargin}`}>
        {/* Header */}
        <AppHeader
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
          planLabel={planLabel}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          notifs={notifs}
          naoLidas={naoLidas}
          marcarLida={marcarLida}
          marcarTodas={marcarTodas}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          onLogout={() => setLogoutConfirm(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
          {/* Welcome */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#1B3C53]">Bem-vindo de volta! 👋</h2>
            <p className="text-sm text-gray-500 mt-0.5">Aqui está um resumo da sua conta.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-5 border"
                style={{ background: s.bg, borderColor: "#D2C1B6" }}
              >
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-2xl font-extrabold" style={{ color: s.text }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Two-column: tools + activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tools — 2/3 */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-[#1B3C53] text-sm mb-3 uppercase tracking-wide">Ferramentas</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                    style={{ borderColor: "#D2C1B6" }}
                  >
                    {/* Accent strip */}
                    <div className="h-1.5 w-full" style={{ background: tool.accent }} />
                    <div className="p-5">
                      <div className="text-3xl mb-3">{tool.icon}</div>
                      <h4 className="font-bold text-[#1B3C53] text-sm mb-1 group-hover:text-[#456882] transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{tool.desc}</p>
                      <div className="mt-3 text-xs font-semibold text-[#456882] group-hover:text-[#1B3C53] transition-colors">
                        Acessar →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity — 1/3 */}
            <div>
              <h3 className="font-bold text-[#1B3C53] text-sm mb-3 uppercase tracking-wide">Atividade Recente</h3>
              <div className="bg-white rounded-2xl border p-5 space-y-1" style={{ borderColor: "#D2C1B6" }}>
                {activity.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3 border-b last:border-0"
                    style={{ borderColor: "#F9F3EF" }}
                  >
                    {/* Dot indicator */}
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subscription info card */}
              <div
                className="mt-4 rounded-2xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #1B3C53 0%, #456882 100%)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "#D2C1B6" }}>Plano Atual</p>
                <p className="text-lg font-bold text-yellow-400">{planLabel}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span style={{ color: "#D2C1B6" }}>{isTrialOrActive ? "Válido até" : "Status"}</span>
                  <span className="font-semibold">{isTrialOrActive ? endsAtLabel : (sub?.status ?? "—")}</span>
                </div>
                <Link
                  href="/#planos"
                  className="mt-4 block text-center py-2 rounded-xl bg-yellow-400 text-[#1B3C53] text-xs font-bold hover:bg-yellow-300 transition-colors"
                >
                  Gerenciar plano
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Logout confirmation modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-[300px] w-full shadow-2xl">
            <div className="px-6 pt-6 pb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-red-600">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-center font-bold text-gray-900 text-base">Sair da conta</h3>
              <p className="text-center text-gray-500 text-sm mt-2 leading-relaxed">
                Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o dashboard.
              </p>
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Sair
                </button>
                <button
                  onClick={() => setLogoutConfirm(false)}
                  className="w-full py-2.5 border text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#D2C1B6" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
