"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle,
  HelpCircle, RefreshCw, ChevronRight, Zap,
} from "lucide-react";
import type { PlantStatus } from "@/types";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

const statusColor: Record<PlantStatus, string> = {
  NORMAL: "#22c55e", ALERT: "#f59e0b", CRITICAL: "#ef4444", UNKNOWN: "#94a3b8", OFFLINE: "#6b7280",
};

type PlantPerf = {
  id: string;
  name: string;
  city?: string | null;
  status: PlantStatus;
  systemKwp?: number | null;
  lastSyncAt?: string | null;
  inverterProvider: string;
  energyLogs: { date: string; todayKwh: number; monthKwh: number }[];
  _count: { alerts: number };
};

function calcPR(plant: PlantPerf): number | null {
  if (!plant.systemKwp || plant.energyLogs.length === 0) return null;
  // PR = média da geração diária / (kWp * irradiação típica BR ~4.5h)
  const recent = plant.energyLogs.slice(-30);
  const avgKwh = recent.reduce((s, l) => s + l.todayKwh, 0) / recent.length;
  const expected = plant.systemKwp * 4.5;
  return Math.min((avgKwh / expected) * 100, 100);
}

function PRBar({ pr }: { pr: number | null }) {
  if (pr === null) return <span className="text-xs text-gray-400">Sem dados</span>;
  const color = pr >= 75 ? "#22c55e" : pr >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pr}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{pr.toFixed(0)}%</span>
    </div>
  );
}

type Period = "15D" | "30D" | "12M";

export default function DesempenhoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plants, setPlants] = useState<PlantPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [period, setPeriod] = useState<Period>("30D");
  const [filter, setFilter] = useState<"TODOS" | "CRITICOS" | "ALERTA" | "NORMAIS">("TODOS");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/desempenho");
    if (res.ok) { const d = await res.json(); setPlants(d.plants); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/plants/sync", { method: "POST" });
    await load();
    setSyncing(false);
  };

  const days = period === "15D" ? 15 : period === "30D" ? 30 : 365;

  const filtered = plants.filter((p) => {
    const pr = calcPR(p);
    if (filter === "CRITICOS") return p.status === "CRITICAL" || (pr !== null && pr < 50);
    if (filter === "ALERTA") return p.status === "ALERT" || (pr !== null && pr >= 50 && pr < 75);
    if (filter === "NORMAIS") return p.status === "NORMAL" && (pr === null || pr >= 75);
    return true;
  });

  const needsIntervention = plants.filter((p) => {
    const pr = calcPR(p);
    return p.status === "CRITICAL" || p.status === "ALERT" || (pr !== null && pr < 60);
  });

  const totalKwh = plants.reduce((s, p) => {
    const recent = p.energyLogs.slice(-days);
    return s + recent.reduce((a, l) => a + l.todayKwh, 0);
  }, 0);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/desempenho" title="Gestão de Desempenho">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {(["15D", "30D", "12M"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={period === p
                ? { background: P.primary, color: "#fff" }
                : { background: "#fff", color: P.mid, border: `1px solid ${P.light}` }}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: P.primary, opacity: syncing ? 0.6 : 1 }}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando..." : "Sincronizar Tudo"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Usinas</p>
          <p className="text-2xl font-bold mt-1" style={{ color: P.primary }}>{plants.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Precisam Atenção</p>
          <p className="text-2xl font-bold mt-1" style={{ color: needsIntervention.length > 0 ? "#ef4444" : "#22c55e" }}>
            {needsIntervention.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Geração ({period})</p>
          <p className="text-2xl font-bold mt-1" style={{ color: P.primary }}>
            {totalKwh >= 1000 ? `${(totalKwh / 1000).toFixed(1)} MWh` : `${totalKwh.toFixed(0)} kWh`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">CO₂ Evitado</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#22c55e" }}>{(totalKwh * 0.0817).toFixed(0)} kg</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["TODOS", "CRITICOS", "ALERTA", "NORMAIS"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={filter === f
              ? { background: f === "CRITICOS" ? "#ef4444" : f === "ALERTA" ? "#f59e0b" : f === "NORMAIS" ? "#22c55e" : P.primary, color: "#fff" }
              : { background: "#fff", color: P.mid, border: `1px solid ${P.light}` }}>
            {f === "TODOS" ? "Todos" : f === "CRITICOS" ? "Críticos" : f === "ALERTA" ? "Com Alerta" : "Normais"}
            {f !== "TODOS" && (
              <span className="ml-1.5 opacity-70">
                ({plants.filter((p) => {
                  const pr = calcPR(p);
                  if (f === "CRITICOS") return p.status === "CRITICAL" || (pr !== null && pr < 50);
                  if (f === "ALERTA") return p.status === "ALERT" || (pr !== null && pr >= 50 && pr < 75);
                  return p.status === "NORMAL" && (pr === null || pr >= 75);
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plant list */}
      <div className="bg-white rounded-xl shadow-solid-3 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Nenhuma usina encontrada.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: P.light }}>
            {filtered.map((plant) => {
              const pr = calcPR(plant);
              const recentKwh = plant.energyLogs.slice(-days).reduce((s, l) => s + l.todayKwh, 0);
              return (
                <div key={plant.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/usinas/${plant.id}`)}>
                  {/* Status dot */}
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: statusColor[plant.status] }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate" style={{ color: P.primary }}>{plant.name}</p>
                      {plant._count.alerts > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                          {plant._count.alerts} alerta{plant._count.alerts > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {plant.city ?? "—"} • {plant.systemKwp ? `${plant.systemKwp} kWp` : "kWp N/D"} • {plant.inverterProvider}
                    </p>
                  </div>

                  {/* PR bar */}
                  <div className="w-40 hidden md:block">
                    <p className="text-xs text-gray-400 mb-1">Performance Ratio</p>
                    <PRBar pr={pr} />
                  </div>

                  {/* Geração */}
                  <div className="text-right hidden sm:block w-28 shrink-0">
                    <p className="text-sm font-bold" style={{ color: P.primary }}>
                      {recentKwh >= 1000 ? `${(recentKwh / 1000).toFixed(1)} MWh` : `${recentKwh.toFixed(0)} kWh`}
                    </p>
                    <p className="text-xs text-gray-400">{period}</p>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
