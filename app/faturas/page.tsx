"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  Receipt, Plus, Search, X, CheckCircle, Clock, AlertCircle,
  XCircle, Ban, Filter,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

type InvoiceStatus = "PENDING" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

interface Invoice {
  id: string;
  referenceMonth: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  client: { id: string; name: string };
  plant: { id: string; name: string } | null;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDING:   { label: "Pendente",   color: "#f59e0b", bg: "#fef3c7", Icon: Clock },
  SENT:      { label: "Enviada",    color: "#3b82f6", bg: "#dbeafe", Icon: Receipt },
  PAID:      { label: "Paga",       color: "#22c55e", bg: "#dcfce7", Icon: CheckCircle },
  OVERDUE:   { label: "Vencida",    color: "#ef4444", bg: "#fee2e2", Icon: AlertCircle },
  CANCELLED: { label: "Cancelada",  color: "#6b7280", bg: "#f3f4f6", Icon: Ban },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function NewInvoiceModal({ clients, onClose, onSave }: {
  clients: Client[]; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    clientId: "", referenceMonth: "", amount: "", dueDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          referenceMonth: form.referenceMonth + "-01",
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro ao criar."); }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: P.light }}>
          <h2 className="font-bold text-lg" style={{ color: P.primary }}>Nova Fatura</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} color="#94a3b8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Cliente *</label>
            <select required value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}>
              <option value="">Selecione um cliente...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Mês de referência *</label>
              <input required type="month" value={form.referenceMonth} onChange={(e) => set("referenceMonth", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Vencimento *</label>
              <input required type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Valor (R$) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
              placeholder="0,00" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Observações</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{ borderColor: P.light }} rows={2} placeholder="Notas adicionais..." />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-semibold border hover:bg-gray-50" style={{ borderColor: P.light }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Criando..." : "Criar fatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FaturasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const load = async () => {
    setLoading(true);
    const [iRes, cRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/clients")]);
    if (iRes.ok) { const d = await iRes.json(); setInvoices(d.invoices ?? []); }
    if (cRes.ok) { const d = await cRes.json(); setClients(d.clients ?? []); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const updateStatus = async (id: string, newStatus: InvoiceStatus) => {
    setUpdating(id);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus, paidAt: newStatus === "PAID" ? new Date().toISOString() : i.paidAt } : i));
    setUpdating(null);
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Excluir esta fatura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = invoices.filter((i) => {
    const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
    const matchSearch = i.client.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "PENDING" || i.status === "SENT").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.amount, 0);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/faturas" title="Faturas">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Recebido</p>
          <p className="text-xl font-bold text-green-600">{formatBRL(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">A receber</p>
          <p className="text-xl font-bold text-blue-600">{formatBRL(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Vencido</p>
          <p className="text-xl font-bold text-red-500">{formatBRL(totalOverdue)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none"
            style={{ borderColor: P.light }} />
        </div>

        <div className="flex gap-1">
          {(["ALL", "PENDING", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const).map((s) => {
            const count = s === "ALL" ? invoices.length : invoices.filter((i) => i.status === s).length;
            if (count === 0 && s !== "ALL") return null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={statusFilter === s
                  ? { background: P.primary, color: "#fff" }
                  : { background: "#fff", color: P.primary, border: `1px solid ${P.light}` }}>
                {s === "ALL" ? `Todos (${count})` : `${statusConfig[s].label} (${count})`}
              </button>
            );
          })}
        </div>

        <button onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={16} /> Nova Fatura
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <Receipt size={40} className="opacity-20 mb-3" />
            <p className="font-medium">{invoices.length === 0 ? "Nenhuma fatura criada" : "Nenhuma fatura neste filtro"}</p>
            {invoices.length === 0 && (
              <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 text-white" style={{ background: P.primary }}>
                Criar primeira fatura
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.light}` }}>
                  {["Cliente", "Referência", "Vencimento", "Valor", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.primary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-[#F9F3EF] transition-colors"
                    style={{ borderTop: idx > 0 ? `1px solid ${P.light}30` : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: P.primary }}>{inv.client.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{formatMonth(inv.referenceMonth)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: P.primary }}>{formatBRL(inv.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                          <button onClick={() => updateStatus(inv.id, "PAID")} disabled={updating === inv.id}
                            className="text-xs rounded-lg px-2 py-1 font-medium transition-colors hover:bg-green-50"
                            style={{ color: "#22c55e", border: "1px solid #22c55e" }}>
                            Marcar paga
                          </button>
                        )}
                        {inv.status === "PENDING" && (
                          <button onClick={() => updateStatus(inv.id, "OVERDUE")} disabled={updating === inv.id}
                            className="text-xs rounded-lg px-2 py-1 font-medium transition-colors hover:bg-red-50"
                            style={{ color: "#ef4444", border: "1px solid #ef4444" }}>
                            Vencida
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <NewInvoiceModal
          clients={clients}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}
    </AppShell>
  );
}
