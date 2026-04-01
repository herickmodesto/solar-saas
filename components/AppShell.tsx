"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard, Zap, Users, FileText, Calculator,
  Receipt, ClipboardList, LifeBuoy, BarChart2, Plug,
  Upload, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, Sun, TrendingUp, Bell, Activity,
} from "lucide-react";

const P = {
  primary: "#1B3C53",
  mid: "#456882",
  light: "#D2C1B6",
  bg: "#F9F3EF",
};

const navItems = [
  { label: "Dashboard",       icon: LayoutDashboard, href: "/dashboard" },
  { label: "Usinas",          icon: Zap,             href: "/usinas" },
  { label: "Desempenho",      icon: Activity,        href: "/desempenho" },
  { label: "Alertas",         icon: Bell,            href: "/alertas" },
  { label: "Clientes",        icon: Users,           href: "/clientes" },
  { label: "Propostas",       icon: FileText,        href: "/proposta" },
  { label: "Calculadora",     icon: Calculator,      href: "/calculadora" },
  { label: "Faturas",         icon: Receipt,         href: "/faturas" },
  { label: "Contratos",       icon: ClipboardList,   href: "/contratos" },
  { label: "Financeiro",      icon: TrendingUp,      href: "/financeiro" },
  { label: "Tickets",         icon: LifeBuoy,        href: "/tickets" },
  { label: "Análise Mensal",  icon: BarChart2,       href: "/analise-mensal" },
  { label: "Credenciais",     icon: Plug,            href: "/credenciais" },
  { label: "Upload Faturas",  icon: Upload,          href: "/upload-fatura" },
];

export function AppSidebar({ active }: { active: string }) {
  const { isExpanded, isHovered, isMobileOpen, toggleSidebar, toggleMobileSidebar, setIsHovered } = useSidebar();
  const router = useRouter();
  const wide = isExpanded || isHovered || isMobileOpen;
  const w = wide ? 280 : 72;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={toggleMobileSidebar} />
      )}
      <aside
        style={{ width: w, background: P.primary, transition: "width 0.25s ease", zIndex: 40 }}
        className="fixed top-0 left-0 h-screen flex flex-col overflow-hidden shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ minHeight: 72 }}>
          <div className="flex items-center justify-center rounded-xl w-10 h-10 shrink-0" style={{ background: "#f5c400" }}>
            <Sun size={22} color={P.primary} />
          </div>
          {wide && <span className="text-white font-bold text-lg whitespace-nowrap overflow-hidden">SolarPro</span>}
          {wide && (
            <button onClick={toggleSidebar} className="ml-auto text-white/50 hover:text-white transition-colors hidden lg:flex">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="menu-item w-full"
                style={isActive
                  ? { background: "rgba(255,255,255,0.12)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.65)" }}
              >
                <Icon size={20} className="shrink-0" />
                {wide && <span className="menu-item-text">{item.label}</span>}
                {isActive && wide && (
                  <span className="ml-auto w-1.5 h-5 rounded-full" style={{ background: "#f5c400" }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => router.push("/configuracoes")}
            className="menu-item w-full"
            style={active === "/configuracoes"
              ? { background: "rgba(255,255,255,0.12)", color: "#fff" }
              : { color: "rgba(255,255,255,0.6)" }}
          >
            <Settings size={20} className="shrink-0" />
            {wide && <span className="menu-item-text">Configurações</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="menu-item w-full"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <LogOut size={20} className="shrink-0" />
            {wide && <span className="menu-item-text">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function NotificationBell() {
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<{
    id: string; type: string; title: string; message: string;
    link: string | null; read: boolean; createdAt: string;
  }[]>([]);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setUnread(d.unreadCount ?? 0); setNotifications(d.notifications ?? []); } })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Notificações"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{ background: "#ef4444", fontSize: 9 }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{ borderColor: P.light }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: P.light }}>
            <span className="font-semibold text-sm" style={{ color: P.primary }}>Notificações</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-700">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Nenhuma notificação</p>
            ) : notifications.slice(0, 20).map((n) => (
              <div key={n.id}
                className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                style={{ borderColor: P.light + "60", background: n.read ? undefined : "#EFF6FF" }}>
                <p className="text-xs font-semibold" style={{ color: P.primary }}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppHeader({ title }: { title: string }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar, toggleSidebar } = useSidebar();
  const { data: session } = useSession();
  const wide = isExpanded || isHovered || isMobileOpen;
  const sideW = wide ? 280 : 72;

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center gap-4 px-6 bg-white border-b"
      style={{ left: sideW, height: 64, transition: "left 0.25s ease", borderColor: "#e8e0d8" }}
    >
      <button onClick={toggleMobileSidebar} className="lg:hidden text-gray-500">
        <Menu size={22} />
      </button>
      {!isExpanded && !isHovered && (
        <button onClick={toggleSidebar} className="hidden lg:flex text-gray-400 hover:text-gray-600">
          <ChevronRight size={20} />
        </button>
      )}
      <h1 className="font-semibold text-lg" style={{ color: P.primary }}>{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white"
          style={{ background: P.primary }}
        >
          {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="hidden md:block text-sm font-medium" style={{ color: P.primary }}>
          {session?.user?.name}
        </span>
      </div>
    </header>
  );
}

/** Wrapper que aplica o layout de sidebar + header + main. */
export function AppShell({
  active,
  title,
  children,
}: {
  active: string;
  title: string;
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered } = useSidebar();
  const wide = isExpanded || isHovered;
  const sideW = wide ? 280 : 72;

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      <AppSidebar active={active} />
      <AppHeader title={title} />
      <main
        style={{ marginLeft: sideW, paddingTop: 64, transition: "margin-left 0.25s ease" }}
        className="p-6"
      >
        {children}
      </main>
    </div>
  );
}
