"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sun, Zap, CheckCircle, AlertTriangle, XCircle, HelpCircle, LogOut } from "lucide-react";
import type { Plant, PlantStatus } from "@/types";

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

export default function PortalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/portal/plants");
      if (res.ok) {
        const d = await res.json();
        setPlants(d.plants ?? []);
        setClientName(d.clientName ?? "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const totalKwp = plants.reduce((s, p) => s + (p.systemKwp ?? 0), 0);
  const normalCount = plants.filter((p) => p.status === "NORMAL").length;
  const alertCount = plants.filter((p) => p.status !== "NORMAL" && p.status !== "UNKNOWN").length;

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-4 flex items-center gap-4"
        style={{ borderColor: P.light }}>
        <div className="flex items-center justify-center rounded-xl w-10 h-10 shrink-0" style={{ background: "#f5c400" }}>
          <Sun size={20} color={P.primary} />
        </div>
        <div>
          <h1 className="font-bold text-lg" style={{ color: P.primary }}>Portal Solar</h1>
          {clientName && <p className="text-xs text-gray-500">{clientName}</p>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium hidden sm:block" style={{ color: P.mid }}>
            {session?.user?.name}
          </span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: P.mid }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-bold" style={{ color: P.primary }}>
            Olá, {session?.user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe o desempenho das suas usinas solares em tempo real.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Usinas", value: plants.length, color: P.primary, icon: <Zap size={20} /> },
            { label: "Normais", value: normalCount, color: "#22c55e", icon: <CheckCircle size={20} /> },
            { label: "kWp Total", value: `${totalKwp.toFixed(1)}`, color: P.mid, icon: <Sun size={20} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-solid-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: color + "18" }}>
                <span style={{ color }}>{icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alertas */}
        {alertCount > 0 && (
          <div className="mb-6 rounded-xl border-l-4 p-4 bg-amber-50" style={{ borderLeftColor: "#f59e0b" }}>
            <p className="font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle size={16} /> {alertCount} usina{alertCount > 1 ? "s" : ""} com alertas ativos
            </p>
            <p className="text-sm text-amber-700 mt-0.5">Clique nas usinas abaixo para ver os detalhes.</p>
          </div>
        )}

        {/* Plants grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 animate-spin"
              style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-solid-3 flex flex-col items-center justify-center py-20 gap-3">
            <Zap size={48} className="opacity-20" color={P.primary} />
            <p className="font-medium text-gray-500">Nenhuma usina vinculada à sua conta</p>
            <p className="text-sm text-gray-400">Entre em contato com o suporte para configurar o acesso.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plants.map((plant) => {
              const totalKw = (plant.devices ?? []).reduce((s, d) => s + (d.currentKw ?? 0), 0);
              return (
                <div key={plant.id}
                  onClick={() => router.push(`/portal/usina/${plant.id}`)}
                  className="bg-white rounded-xl shadow-solid-3 p-5 cursor-pointer transition-all hover:shadow-solid-4 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: P.primary + "15" }}>
                        <Sun size={20} color={P.primary} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: P.primary }}>{plant.name}</p>
                        <p className="text-xs text-gray-400">
                          {plant.city ? `${plant.city}${plant.state ? ` - ${plant.state}` : ""}` : "—"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
                      style={{ background: statusColor[plant.status] + "18", color: statusColor[plant.status] }}>
                      <StatusIcon status={plant.status} />
                      {statusLabel[plant.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                      <p className="text-xs text-gray-500">kWp</p>
                      <p className="font-bold text-sm" style={{ color: P.primary }}>{plant.systemKwp ?? "—"}</p>
                    </div>
                    <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                      <p className="text-xs text-gray-500">Potência</p>
                      <p className="font-bold text-sm" style={{ color: totalKw > 0 ? "#22c55e" : "#94a3b8" }}>
                        {totalKw > 0 ? `${totalKw.toFixed(1)}kW` : "—"}
                      </p>
                    </div>
                    <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                      <p className="text-xs text-gray-500">Alertas</p>
                      <p className="font-bold text-sm" style={{ color: plant._count?.alerts ? "#f59e0b" : "#94a3b8" }}>
                        {plant._count?.alerts ?? 0}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-blue-600 font-medium">Ver detalhes →</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
