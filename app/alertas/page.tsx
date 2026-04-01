"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  AlertTriangle, CheckCircle, XCircle, Filter, ChevronRight,
  Bell, BellOff,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

type AlertItem = {
  id: string;
  alertType: string;
  message: string;
  deviceSn?: string | null;
  isResolved: boolean;
  occurredAt: string;
  resolvedAt?: string | null;
  plant: { id: string; name: string; city?: string | null };
};

type FilterType = "TODOS" | "ABERTOS" | "RESOLVIDOS" | "FAULT" | "WARNING";

export default function AlertasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ABERTOS");
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/alertas");
    if (res.ok) { const d = await res.json(); setAlerts(d.alerts); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const resolve = async (id: string) => {
    setResolving(id);
    await fetch(`/api/alerts/${id}/resolve`, { method: "PATCH" });
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a));
    setResolving(null);
  };

  const resolveAll = async () => {
    const open = filtered.filter((a) => !a.isResolved);
    for (const a of open) await fetch(`/api/alerts/${a.id}/resolve`, { method: "PATCH" });
    await load();
  };

  const filtered = alerts.filter((a) => {
    if (filter === "ABERTOS") return !a.isResolved;
    if (filter === "RESOLVIDOS") return a.isResolved;
    if (filter === "FAULT") return a.alertType === "FAULT" && !a.isResolved;
    if (filter === "WARNING") return a.alertType === "WARNING" && !a.isResolved;
    return true;
  });

  const openCount = alerts.filter((a) => !a.isResolved).length;
  const faultCount = alerts.filter((a) => !a.isResolved && a.alertType === "FAULT").length;
  const warnCount = alerts.filter((a) => !a.isResolved && a.alertType === "WARNING").length;

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/alertas" title="Central de Alertas">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Alertas</p>
          <p className="text-2xl font-bold mt-1" style={{ color: P.primary }}>{alerts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Abertos</p>
          <p className="text-2xl font-bold mt-1" style={{ color: openCount > 0 ? "#f59e0b" : "#22c55e" }}>{openCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Falhas Críticas</p>
          <p className="text-2xl font-bold mt-1" style={{ color: faultCount > 0 ? "#ef4444" : "#22c55e" }}>{faultCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-solid-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Avisos</p>
          <p className="text-2xl font-bold mt-1" style={{ color: warnCount > 0 ? "#f59e0b" : "#22c55e" }}>{warnCount}</p>
        </div>
      </div>

      {/* Filter + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {(["TODOS", "ABERTOS", "RESOLVIDOS", "FAULT", "WARNING"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={filter === f
                ? { background: P.primary, color: "#fff" }
                : { background: "#fff", color: P.mid, border: `1px solid ${P.light}` }}>
              {f === "TODOS" ? "Todos" : f === "ABERTOS" ? `Abertos (${openCount})` : f === "RESOLVIDOS" ? "Resolvidos" : f === "FAULT" ? "Falhas" : "Avisos"}
            </button>
          ))}
        </div>
        {openCount > 0 && (
          <button onClick={resolveAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#22c55e" }}>
            <CheckCircle size={14} />
            Resolver Todos
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="bg-white rounded-xl shadow-solid-3 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BellOff size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">
              {filter === "ABERTOS" ? "Nenhum alerta aberto. Tudo certo!" : "Nenhum alerta encontrado."}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: P.light }}>
            {filtered.map((alert) => {
              const isOpen = !alert.isResolved;
              const isFault = alert.alertType === "FAULT";
              return (
                <div key={alert.id}
                  className="flex items-start gap-4 px-5 py-4 transition-colors"
                  style={{ background: isOpen ? (isFault ? "#fff5f5" : "#fffbeb") : "#fff" }}>
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isOpen
                      ? isFault
                        ? <XCircle size={18} color="#ef4444" />
                        : <AlertTriangle size={18} color="#f59e0b" />
                      : <CheckCircle size={18} color="#22c55e" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm" style={{ color: isOpen ? P.primary : "#6b7280" }}>
                        {alert.message}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: isFault ? "#fee2e2" : "#fef3c7",
                          color: isFault ? "#b91c1c" : "#92400e",
                        }}>
                        {alert.alertType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(alert.occurredAt).toLocaleString("pt-BR")}
                      {alert.deviceSn && ` • SN: ${alert.deviceSn}`}
                    </p>
                    <button
                      onClick={() => router.push(`/usinas/${alert.plant.id}`)}
                      className="flex items-center gap-1 text-xs font-semibold mt-1 hover:underline"
                      style={{ color: P.mid }}>
                      <Bell size={11} />
                      {alert.plant.name}
                      {alert.plant.city && ` • ${alert.plant.city}`}
                      <ChevronRight size={11} />
                    </button>
                    {alert.isResolved && alert.resolvedAt && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Resolvido em {new Date(alert.resolvedAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {isOpen && (
                    <button
                      onClick={() => resolve(alert.id)}
                      disabled={resolving === alert.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors shrink-0 disabled:opacity-50">
                      {resolving === alert.id ? "..." : "Resolver"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
