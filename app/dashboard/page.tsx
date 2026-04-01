"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppSidebar, AppHeader } from "@/components/AppShell";
import {
  Zap, AlertTriangle, CheckCircle, XCircle, HelpCircle, MoreVertical,
  RefreshCw, User, Sun, Map,
} from "lucide-react";
import type { Plant, PlantStatus } from "@/types";

const PlantMap = dynamic(() => import("@/components/PlantMap"), { ssr: false });

// ── Palette ───────────────────────────────────────────────────
const P = {
  primary: "#1B3C53",
  mid: "#456882",
  light: "#D2C1B6",
  bg: "#F9F3EF",
};

// ── Status helpers ────────────────────────────────────────────
const statusColor: Record<PlantStatus, string> = {
  NORMAL: "#22c55e",
  ALERT: "#f59e0b",
  CRITICAL: "#ef4444",
  UNKNOWN: "#94a3b8",
  OFFLINE: "#6b7280",
};

const statusLabel: Record<PlantStatus, string> = {
  NORMAL: "Normal",
  ALERT: "Com Alerta",
  CRITICAL: "Crítico",
  UNKNOWN: "Desconhecido",
  OFFLINE: "Offline",
};

const StatusIcon = ({ status }: { status: PlantStatus }) => {
  const color = statusColor[status];
  if (status === "NORMAL") return <CheckCircle size={16} color={color} />;
  if (status === "CRITICAL") return <XCircle size={16} color={color} />;
  if (status === "ALERT") return <AlertTriangle size={16} color={color} />;
  if (status === "OFFLINE") return <XCircle size={16} color={color} />;
  return <HelpCircle size={16} color={color} />;
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-solid-3 flex gap-4 items-start">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color: P.primary }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<PlantStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const wide = isExpanded || isHovered;
  const sideW = wide ? 280 : 72;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role === "CLIENT") router.push("/portal");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const load = async () => {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([fetch("/api/plants"), fetch("/api/me/stats")]);
      if (pRes.ok) { const d = await pRes.json(); setPlants(d.plants ?? []); }
      if (sRes.ok) { const d = await sRes.json(); setStats(d); }
      setLoading(false);
    };
    load();
  }, [status]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/plants/sync", { method: "POST" });
    const pRes = await fetch("/api/plants");
    if (pRes.ok) { const d = await pRes.json(); setPlants(d.plants ?? []); }
    setSyncing(false);
  };

  const filtered = filter === "ALL" ? plants : plants.filter((p) => p.status === filter);
  const statusCounts: Record<string, number> = { ALL: plants.length };
  plants.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1; });

  const alertPlants = plants.filter((p) => p.status === "ALERT" || p.status === "CRITICAL").length;
  const pctNormal = plants.length > 0 ? Math.round((statusCounts["NORMAL"] ?? 0) / plants.length * 100) : 0;

  const filterOptions: { label: string; key: PlantStatus | "ALL" }[] = [
    { label: "Todos", key: "ALL" },
    { label: "Normal", key: "NORMAL" },
    { label: "Com Alerta", key: "ALERT" },
    { label: "Crítico", key: "CRITICAL" },
    { label: "Desconhecido", key: "UNKNOWN" },
    { label: "Offline", key: "OFFLINE" },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      <AppSidebar active="/dashboard" />
      <AppHeader title="Dashboard de Usinas" />

      <main style={{ marginLeft: sideW, paddingTop: 64, transition: "margin-left 0.25s ease" }} className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de Usinas" value={stats.plants ?? 0}
            sub={`${((stats.totalKwp ?? 0) / 1000).toFixed(2)} GWh estimados`}
            color={P.primary} icon={<Zap size={22} />} />
          <StatCard label="Usinas Normais" value={`${pctNormal}%`}
            sub={`${statusCounts["NORMAL"] ?? 0} de ${plants.length} usinas`}
            color="#22c55e" icon={<CheckCircle size={22} />} />
          <StatCard label="Com Alertas" value={alertPlants}
            sub={`${stats.alerts ?? 0} alertas pendentes`}
            color="#f59e0b" icon={<AlertTriangle size={22} />} />
          <StatCard label="Clientes" value={stats.clients ?? 0}
            sub={`${stats.proposals ?? 0} propostas geradas`}
            color={P.mid} icon={<User size={22} />} />
        </div>

        {/* Mapa das Usinas */}
        {plants.length > 0 && (
          <div className="bg-white rounded-xl shadow-solid-3 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "#e8e0d8" }}>
              <Map size={16} color={P.primary} />
              <span className="font-semibold text-sm" style={{ color: P.primary }}>Mapa das Usinas</span>
              <span className="ml-auto text-xs text-gray-400">
                {plants.filter(p => p.latitude && p.longitude).length} de {plants.length} com localização
              </span>
            </div>
            <div style={{ height: 380 }}>
              <PlantMap plants={plants} onPlantClick={(plant) => router.push(`/usinas?id=${plant.id}`)} />
            </div>
          </div>
        )}

        {/* Filters + Sync */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {filterOptions.map((f) => {
            const count = statusCounts[f.key] ?? 0;
            const isActive = filter === f.key;
            if (count === 0 && f.key !== "ALL") return null;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={isActive
                  ? { background: P.primary, color: "#fff" }
                  : { background: "#fff", color: P.primary, border: `1px solid ${P.light}` }}>
                {f.label}
                <span className="text-xs rounded-full px-1.5 py-0.5 font-bold"
                  style={isActive ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : { background: P.bg, color: P.mid }}>
                  {count}
                </span>
              </button>
            );
          })}
          <button onClick={handleSync} disabled={syncing}
            className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{ background: P.primary, color: "#fff", opacity: syncing ? 0.7 : 1 }}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando..." : "Sincronizar Growatt"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-solid-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.light}` }}>
                  {["Usina", "Cliente", "Cidade", "Status", "Potência Atual", "kWp", "Última Sync", ""].map((h) => (
                    <th key={h} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide ${h === "Status" || h === "Potência Atual" || h === "kWp" ? "text-center" : "text-left"}`}
                      style={{ color: P.primary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      {plants.length === 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <Zap size={40} className="opacity-20" />
                          <p className="font-medium">Nenhuma usina cadastrada</p>
                          <button onClick={() => router.push("/usinas")}
                            className="text-sm font-semibold rounded-lg px-4 py-2"
                            style={{ background: P.primary, color: "#fff" }}>
                            Cadastrar Usina
                          </button>
                        </div>
                      ) : "Nenhuma usina com este filtro"}
                    </td>
                  </tr>
                ) : filtered.map((plant, idx) => {
                  const totalKw = (plant.devices ?? []).reduce((s, d) => s + (d.currentKw ?? 0), 0);
                  return (
                    <tr key={plant.id} onClick={() => router.push(`/usinas?id=${plant.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[#F9F3EF]"
                      style={{ borderTop: idx > 0 ? `1px solid ${P.light}30` : undefined }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: P.primary + "15" }}>
                            <Sun size={18} color={P.primary} />
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: P.primary }}>{plant.name}</p>
                            {plant.growattPlantId && (
                              <p className="text-xs text-gray-400">ID: {plant.growattPlantId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: plant.client ? P.primary : "#94a3b8" }}>
                        {plant.client?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {plant.city ? `${plant.city}${plant.state ? ` - ${plant.state}` : ""}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: statusColor[plant.status] + "18", color: statusColor[plant.status] }}>
                          <StatusIcon status={plant.status} />
                          {statusLabel[plant.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold" style={{ color: P.primary }}>
                        {totalKw > 0 ? `${totalKw.toFixed(1)} kW` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {plant.systemKwp ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {plant.lastSyncAt
                          ? new Date(plant.lastSyncAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                          : "Nunca"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative" ref={menuOpen === plant.id ? menuRef : null}>
                          <button onClick={() => setMenuOpen(menuOpen === plant.id ? null : plant.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical size={16} color="#94a3b8" />
                          </button>
                          {menuOpen === plant.id && (
                            <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border py-1 min-w-40"
                              style={{ borderColor: P.light }}>
                              <button onClick={() => { router.push(`/usinas?id=${plant.id}`); setMenuOpen(null); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors" style={{ color: P.primary }}>
                                Ver detalhes
                              </button>
                              <button onClick={() => { router.push(`/usinas?edit=${plant.id}`); setMenuOpen(null); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors" style={{ color: P.primary }}>
                                Editar
                              </button>
                              <button onClick={async () => {
                                  setMenuOpen(null); setSyncing(true);
                                  await fetch(`/api/plants/${plant.id}/monitoring`);
                                  const r = await fetch("/api/plants");
                                  if (r.ok) { const d = await r.json(); setPlants(d.plants ?? []); }
                                  setSyncing(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors" style={{ color: P.mid }}>
                                Sincronizar agora
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          SolarPro © {new Date().getFullYear()} — Plataforma de Gestão Solar
        </p>
      </main>
    </div>
  );
}
