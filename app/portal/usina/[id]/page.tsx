"use client";
import React, { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sun, ArrowLeft, CheckCircle, AlertTriangle, XCircle, HelpCircle, RefreshCw } from "lucide-react";
import type { Plant, PlantStatus, PlantMonitoring } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

const statusColor: Record<PlantStatus, string> = {
  NORMAL: "#22c55e", ALERT: "#f59e0b", CRITICAL: "#ef4444", UNKNOWN: "#94a3b8", OFFLINE: "#6b7280",
};
const statusLabel: Record<PlantStatus, string> = {
  NORMAL: "Normal", ALERT: "Com Alerta", CRITICAL: "Crítico", UNKNOWN: "Desconhecido", OFFLINE: "Offline",
};

const StatusIcon = ({ status }: { status: PlantStatus }) => {
  const c = statusColor[status];
  if (status === "NORMAL") return <CheckCircle size={14} color={c} />;
  if (status === "CRITICAL") return <XCircle size={14} color={c} />;
  if (status === "ALERT") return <AlertTriangle size={14} color={c} />;
  if (status === "OFFLINE") return <XCircle size={14} color={c} />;
  return <HelpCircle size={14} color={c} />;
};

export default function PortalUsinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [monitoring, setMonitoring] = useState<PlantMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlant = async () => {
    // Portal clients access via the team API but only see their own plants
    const r = await fetch(`/api/plants/${id}`);
    if (r.ok) { const d = await r.json(); setPlant(d.plant); }
  };

  const loadMonitoring = async () => {
    const r = await fetch(`/api/plants/${id}/monitoring`);
    if (r.ok) { const d = await r.json(); setMonitoring(d.monitoring); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadPlant(), loadMonitoring()]);
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMonitoring();
    setRefreshing(false);
  };

  const energyData = monitoring ? [
    { name: "Hoje", kWh: monitoring.todayKwh },
    { name: "Este Mês", kWh: monitoring.monthKwh },
    { name: "Este Ano", kWh: monitoring.yearKwh },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: P.bg }}>
        <p className="text-gray-500">Usina não encontrada ou sem acesso.</p>
        <button onClick={() => router.push("/portal")}
          className="flex items-center gap-2 text-sm font-medium" style={{ color: P.primary }}>
          <ArrowLeft size={16} /> Voltar ao portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: P.light }}>
        <button onClick={() => router.push("/portal")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} color={P.primary} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f5c400" }}>
          <Sun size={18} color={P.primary} />
        </div>
        <div>
          <h1 className="font-bold" style={{ color: P.primary }}>{plant.name}</h1>
          <p className="text-xs text-gray-400">
            {plant.city ? `${plant.city}${plant.state ? ` - ${plant.state}` : ""}` : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: statusColor[plant.status] + "18", color: statusColor[plant.status] }}>
            <StatusIcon status={plant.status} />
            {statusLabel[plant.status]}
          </span>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} color={P.mid} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Potência Instalada", value: plant.systemKwp ? `${plant.systemKwp} kWp` : "—" },
            { label: "Data de Instalação", value: plant.installDate ? new Date(plant.installDate).toLocaleDateString("pt-BR") : "—" },
            { label: "Inversores", value: plant.devices?.length ?? 0 },
            { label: "Endereço", value: plant.address ?? plant.city ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-solid-3">
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="font-bold" style={{ color: P.primary }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Monitoring cards */}
        {monitoring ? (
          <>
            <div>
              <h2 className="font-bold mb-3" style={{ color: P.primary }}>Geração de Energia</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Potência Atual", value: `${monitoring.currentKw.toFixed(2)} kW`, highlight: true },
                  { label: "Hoje", value: `${monitoring.todayKwh.toFixed(1)} kWh` },
                  { label: "Este Mês", value: `${monitoring.monthKwh.toFixed(1)} kWh` },
                  { label: "Este Ano", value: `${monitoring.yearKwh.toFixed(1)} kWh` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="bg-white rounded-xl p-4 shadow-solid-3 text-center"
                    style={highlight ? { background: P.primary } : {}}>
                    <p className="text-xs font-medium mb-1" style={{ color: highlight ? "rgba(255,255,255,0.7)" : "#6b7280" }}>
                      {label}
                    </p>
                    <p className="font-bold text-lg" style={{ color: highlight ? "#f5c400" : P.primary }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-xl p-5 shadow-solid-3">
                <h3 className="text-sm font-semibold mb-4" style={{ color: P.primary }}>Comparativo de Geração</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={energyData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(1)} kWh`]} />
                    <Bar dataKey="kWh" fill={P.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : plant.growattPlantId ? (
          <div className="bg-white rounded-xl p-6 shadow-solid-3 text-center text-gray-400">
            <p>Dados de monitoramento indisponíveis no momento.</p>
            <button onClick={handleRefresh} className="mt-3 text-sm font-medium" style={{ color: P.primary }}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-solid-3 text-center text-gray-400">
            <p>Monitoramento Growatt não configurado para esta usina.</p>
          </div>
        )}

        {/* Devices */}
        {plant.devices && plant.devices.length > 0 && (
          <div>
            <h2 className="font-bold mb-3" style={{ color: P.primary }}>Inversores</h2>
            <div className="space-y-3">
              {plant.devices.map((d) => (
                <div key={d.id} className="bg-white rounded-xl p-4 shadow-solid-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: P.primary }}>{d.brand} {d.model ?? ""}</p>
                    <p className="text-xs text-gray-400">Série: {d.serialNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: d.currentKw && d.currentKw > 0 ? "#22c55e" : "#94a3b8" }}>
                      {d.currentKw && d.currentKw > 0 ? `${d.currentKw.toFixed(2)} kW` : "Offline"}
                    </p>
                    <p className="text-xs text-gray-400">{d.status ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {plant.alerts && plant.alerts.filter((a) => !a.isResolved).length > 0 && (
          <div>
            <h2 className="font-bold mb-3 text-amber-700">Alertas Ativos</h2>
            <div className="space-y-2">
              {plant.alerts.filter((a) => !a.isResolved).map((a) => (
                <div key={a.id} className="rounded-xl p-4 border-l-4"
                  style={{ background: "#fff7ed", borderLeftColor: a.alertType === "FAULT" ? "#ef4444" : "#f59e0b" }}>
                  <p className="font-medium text-amber-800">{a.message}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{new Date(a.occurredAt).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Última atualização: {monitoring?.syncedAt ? new Date(monitoring.syncedAt).toLocaleString("pt-BR") : "—"}
        </p>
      </main>
    </div>
  );
}
