"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  TrendingUp, DollarSign, AlertCircle, ClipboardList,
  Receipt, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from "recharts";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface FinanceSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  activeContracts: number;
  contractMonthlyRevenue: number;
  invoiceCount: number;
}

interface RevenuePoint {
  month: string;
  label: string;
  paid: number;
  pending: number;
  overdue: number;
}

function SummaryCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex gap-4 items-start">
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

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-sm" style={{ borderColor: P.light }}>
      <p className="font-semibold mb-2" style={{ color: P.primary }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function FinanceiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [chart, setChart] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/financeiro")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary);
        setChart(d.revenueChart ?? []);
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  const hasData = summary && summary.invoiceCount > 0;

  return (
    <AppShell active="/financeiro" title="Painel Financeiro">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Total recebido" color="#22c55e" icon={<TrendingUp size={22} />}
          value={formatBRL(summary?.totalPaid ?? 0)}
          sub={`de ${summary?.invoiceCount ?? 0} fatura(s)`}
        />
        <SummaryCard
          label="A receber" color="#3b82f6" icon={<DollarSign size={22} />}
          value={formatBRL(summary?.totalPending ?? 0)}
          sub="faturas pendentes/enviadas"
        />
        <SummaryCard
          label="Vencido" color="#ef4444" icon={<AlertCircle size={22} />}
          value={formatBRL(summary?.totalOverdue ?? 0)}
          sub="requer atenção"
        />
        <SummaryCard
          label="Contratos ativos" color={P.primary} icon={<ClipboardList size={22} />}
          value={String(summary?.activeContracts ?? 0)}
          sub="contratos em vigor"
        />
        <SummaryCard
          label="Receita mensal (contratos)" color="#f59e0b" icon={<Receipt size={22} />}
          value={formatBRL(summary?.contractMonthlyRevenue ?? 0)}
          sub="valor mensal esperado"
        />
        <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ações rápidas</p>
          <div className="space-y-2">
            <button onClick={() => router.push("/faturas")}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ color: P.primary, border: `1px solid ${P.light}` }}>
              Nova fatura <ArrowUpRight size={15} />
            </button>
            <button onClick={() => router.push("/contratos")}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ color: P.primary, border: `1px solid ${P.light}` }}>
              Ver contratos <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-base mb-4" style={{ color: P.primary }}>
          Receita mensal — últimos 12 meses
        </h2>

        {!hasData ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <TrendingUp size={40} className="opacity-20 mb-3" />
            <p className="font-medium">Nenhuma fatura criada ainda</p>
            <button onClick={() => router.push("/faturas")}
              className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 text-white"
              style={{ background: P.primary }}>
              Criar primeira fatura
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chart} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.light} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.mid }} />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: P.mid }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: P.mid }} />
              <Bar dataKey="paid" name="Pago" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pendente" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" name="Vencido" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </AppShell>
  );
}
