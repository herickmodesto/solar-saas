"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  ArrowLeft, Zap, CheckCircle, AlertTriangle, XCircle, HelpCircle,
  RefreshCw, MapPin, Calendar, Cpu, Bell, TrendingUp, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { PlantStatus } from "@/types";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

const statusColor: Record<PlantStatus, string> = {
  NORMAL: "#22c55e", ALERT: "#f59e0b", CRITICAL: "#ef4444", UNKNOWN: "#94a3b8", OFFLINE: "#6b7280",
};
const statusLabel: Record<PlantStatus, string> = {
  NORMAL: "Normal", ALERT: "Com Alerta", CRITICAL: "Crítico", UNKNOWN: "Desconhecido", OFFLINE: "Offline",
};

function StatusBadge({ status }: { status: PlantStatus }) {
  const color = statusColor[status];
  const label = statusLabel[status];
  const Icon = status === "NORMAL" ? CheckCircle
    : status === "CRITICAL" ? XCircle
    : status === "ALERT" ? AlertTriangle
    : status === "OFFLINE" ? XCircle
    : HelpCircle;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: color }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function StatCard({ label, value, unit, icon, color }: {
  label: string; value: string | number; unit?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-solid-3 flex gap-4 items-start">
      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold mt-0.5" style={{ color: P.primary }}>
          {value}{unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

type Device = {
  id: string; serialNumber: string; model?: string | null;
  brand: string; status?: string | null; currentKw?: number | null; lastSyncAt?: string | null;
};
type Alert = {
  id: string; alertType: string; message: string; deviceSn?: string | null;
  isResolved: boolean; occurredAt: string;
};
type EnergyLog = { date: string; todayKwh: number; currentKw: number; monthKwh: number };
type PlantDetail = {
  id: string; name: string; city?: string | null; state?: string | null;
  address?: string | null; systemKwp?: number | null; installDate?: string | null;
  status: PlantStatus; lastSyncAt?: string | null; inverterProvider: string;
  client?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  devices: Device[]; alerts: Alert[]; energyLogs: EnergyLog[];
  _count: { devices: number; alerts: number };
};

export default function PlantDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [plant, setPlant] = useState<PlantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"energia" | "dispositivos" | "alertas">("energia");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/plants/${id}/detail`);
    if (res.ok) {
      const d = await res.json();
      setPlant(d.plant);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated" && id) load();
  }, [status, id]);

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/plants/sync", { method: "POST" });
    await load();
    setSyncing(false);
  };

  const resolveAlert = async (alertId: string) => {
    await fetch(`/api/alerts/${alertId}/resolve`, { method: "PATCH" });
    setPlant((p) => p ? {
      ...p,
      alerts: p.alerts.map((a) => a.id === alertId ? { ...a, isResolved: true } : a),
    } : p);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!plant) {
    return (
      <AppShell active="/usinas" title="Usina não encontrada">
        <div className="text-center py-20 text-gray-400">Usina não encontrada.</div>
      </AppShell>
    );
  }

  const energyChartData = plant.energyLogs.map((l) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    kWh: Number(l.todayKwh.toFixed(1)),
  }));

  const lastLog = plant.energyLogs[plant.energyLogs.length - 1];
  const openAlerts = plant.alerts.filter((a) => !a.isResolved);

  return (
    <AppShell active="/usinas" title={plant.name}>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/usinas")}
          className="p-2 rounded-lg hover:bg-white transition-colors text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: P.primary }}>{plant.name}</h1>
            <StatusBadge status={plant.status} />
            <span className="text-xs text-gray-400">{plant.inverterProvider}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <MapPin size={11} />
            {[plant.city, plant.state].filter(Boolean).join(", ") || "Localização não informada"}
            {plant.lastSyncAt && (
              <span className="ml-2">• Última sync: {new Date(plant.lastSyncAt).toLocaleString("pt-BR")}</span>
            )}
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ background: P.primary, opacity: syncing ? 0.6 : 1 }}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Potência Atual" value={lastLog?.currentKw?.toFixed(2) ?? "—"} unit="kW" icon={<Activity size={20} />} color="#f59e0b" />
        <StatCard label="Hoje" value={lastLog?.todayKwh?.toFixed(1) ?? "—"} unit="kWh" icon={<Zap size={20} />} color="#22c55e" />
        <StatCard label="Este Mês" value={lastLog?.monthKwh?.toFixed(0) ?? "—"} unit="kWh" icon={<TrendingUp size={20} />} color="#3b82f6" />
        <StatCard label="Capacidade" value={plant.systemKwp?.toFixed(2) ?? "—"} unit="kWp" icon={<Cpu size={20} />} color={P.mid} />
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plant.client && (
          <div className="bg-white rounded-xl p-4 shadow-solid-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Cliente</p>
            <p className="font-semibold text-sm" style={{ color: P.primary }}>{plant.client.name}</p>
            {plant.client.email && <p className="text-xs text-gray-500">{plant.client.email}</p>}
            {plant.client.phone && <p className="text-xs text-gray-500">{plant.client.phone}</p>}
          </div>
        )}
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Instalação</p>
          <p className="text-sm flex items-center gap-2" style={{ color: P.primary }}>
            <Calendar size={14} />
            {plant.installDate ? new Date(plant.installDate).toLocaleDateString("pt-BR") : "Não informado"}
          </p>
          {plant.address && <p className="text-xs text-gray-500 mt-1">{plant.address}</p>}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Dispositivos</p>
          <p className="text-2xl font-bold" style={{ color: P.primary }}>{plant._count.devices}</p>
          <p className="text-xs text-gray-400">inversores/equipamentos</p>
          {openAlerts.length > 0 && (
            <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <Bell size={11} /> {openAlerts.length} alerta{openAlerts.length > 1 ? "s" : ""} aberto{openAlerts.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-solid-3 overflow-hidden">
        <div className="flex border-b" style={{ borderColor: P.light }}>
          {(["energia", "dispositivos", "alertas"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-semibold capitalize transition-colors"
              style={activeTab === tab
                ? { color: P.primary, borderBottom: `2px solid ${P.primary}` }
                : { color: "#9ca3af" }}>
              {tab === "energia" ? "Geração" : tab === "dispositivos" ? "Dispositivos" : `Alertas (${openAlerts.length})`}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Aba Energia */}
          {activeTab === "energia" && (
            <div>
              {energyChartData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Nenhum dado de geração disponível.<br />Sincronize a usina para gerar o histórico.
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                    Geração diária — últimos {energyChartData.length} dias
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={energyChartData} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} unit=" kWh" width={60} />
                      <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kWh`, "Geração"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="kWh" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          )}

          {/* Aba Dispositivos */}
          {activeTab === "dispositivos" && (
            <div>
              {plant.devices.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Nenhum dispositivo encontrado. Sincronize para importar.</div>
              ) : (
                <div className="space-y-3">
                  {plant.devices.map((dev) => (
                    <div key={dev.id} className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderColor: P.light }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: P.primary + "12" }}>
                          <Cpu size={16} color={P.mid} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: P.primary }}>
                            {dev.model ?? dev.brand} — {dev.serialNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {dev.currentKw != null ? `${dev.currentKw.toFixed(2)} kW` : "—"}
                            {dev.lastSyncAt ? ` • sync ${new Date(dev.lastSyncAt).toLocaleString("pt-BR")}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: dev.status === "1" || dev.status?.toLowerCase() === "normal" ? "#dcfce7" : "#fef3c7",
                          color: dev.status === "1" || dev.status?.toLowerCase() === "normal" ? "#15803d" : "#92400e",
                        }}>
                        {dev.status === "1" || dev.status?.toLowerCase() === "normal" ? "Normal" : dev.status || "Desconhecido"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba Alertas */}
          {activeTab === "alertas" && (
            <div>
              {plant.alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Nenhum alerta registrado.</div>
              ) : (
                <div className="space-y-3">
                  {plant.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg border"
                      style={{ borderColor: alert.isResolved ? "#e5e7eb" : "#fed7aa", background: alert.isResolved ? "#fff" : "#fffbeb" }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} color={alert.isResolved ? "#9ca3af" : "#f59e0b"} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: alert.isResolved ? "#6b7280" : P.primary }}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {alert.alertType} • {new Date(alert.occurredAt).toLocaleString("pt-BR")}
                            {alert.deviceSn && ` • SN: ${alert.deviceSn}`}
                          </p>
                        </div>
                      </div>
                      {!alert.isResolved && (
                        <button onClick={() => resolveAlert(alert.id)}
                          className="text-xs px-2 py-1 rounded-lg font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors shrink-0 ml-2">
                          Resolver
                        </button>
                      )}
                      {alert.isResolved && <span className="text-xs text-gray-400 shrink-0 ml-2">Resolvido</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
