"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  ClipboardList, Plus, X, Trash2, Edit2, CheckCircle,
  XCircle, Clock, AlertCircle,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

type ContractStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_SIGNATURE";

interface Contract {
  id: string; title: string; startDate: string; endDate: string | null;
  monthlyAmount: number; adjustmentIndex: string | null;
  status: ContractStatus; signedAt: string | null; pdfUrl: string | null;
  client: { id: string; name: string };
  createdAt: string; updatedAt: string;
}
interface Client { id: string; name: string; }

const statusCfg: Record<ContractStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  ACTIVE:             { label: "Ativo",               color: "#22c55e", bg: "#dcfce7", Icon: CheckCircle },
  EXPIRED:            { label: "Expirado",             color: "#6b7280", bg: "#f3f4f6", Icon: XCircle },
  CANCELLED:          { label: "Cancelado",            color: "#ef4444", bg: "#fee2e2", Icon: XCircle },
  PENDING_SIGNATURE:  { label: "Aguardando assinatura",color: "#f59e0b", bg: "#fef3c7", Icon: Clock },
};

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("pt-BR"); }

function StatusBadge({ status }: { status: ContractStatus }) {
  const cfg = statusCfg[status];
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={12} />{cfg.label}
    </span>
  );
}

function ExpiringWarning({ endDate }: { endDate: string | null }) {
  if (!endDate) return null;
  const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (daysLeft > 30 || daysLeft < 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
      <AlertCircle size={11} /> Vence em {daysLeft}d
    </span>
  );
}

function ContractModal({ clients, contract, onClose, onSave }: {
  clients: Client[]; contract: Contract | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    clientId: contract?.client.id ?? "",
    title: contract?.title ?? "",
    startDate: contract ? contract.startDate.split("T")[0] : "",
    endDate: contract?.endDate ? contract.endDate.split("T")[0] : "",
    monthlyAmount: contract?.monthlyAmount?.toString() ?? "",
    adjustmentIndex: contract?.adjustmentIndex ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = contract ? `/api/contracts/${contract.id}` : "/api/contracts";
      const method = contract ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          title: form.title,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          monthlyAmount: parseFloat(form.monthlyAmount),
          adjustmentIndex: form.adjustmentIndex || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro."); }
      onSave();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: P.light }}>
          <h2 className="font-bold text-lg" style={{ color: P.primary }}>{contract ? "Editar Contrato" : "Novo Contrato"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} color="#94a3b8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!contract && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Cliente *</label>
              <select required value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}>
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Título *</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}
              placeholder="Ex: Contrato de Locação Solar - João Silva" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Valor mensal (R$) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.monthlyAmount} onChange={(e) => set("monthlyAmount", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}
              placeholder="0,00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Início *</label>
              <input required type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Término</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Índice de reajuste</label>
            <input value={form.adjustmentIndex} onChange={(e) => set("adjustmentIndex", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}
              placeholder="Ex: IPCA, IGPM, 5% a.a." />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-semibold border hover:bg-gray-50" style={{ borderColor: P.light }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando..." : contract ? "Salvar" : "Criar contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContratosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const load = async () => {
    setLoading(true);
    const [cRes, clRes] = await Promise.all([fetch("/api/contracts"), fetch("/api/clients")]);
    if (cRes.ok) { const d = await cRes.json(); setContracts(d.contracts ?? []); }
    if (clRes.ok) { const d = await clRes.json(); setClients(d.clients ?? []); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const changeStatus = async (id: string, newStatus: ContractStatus) => {
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
    });
    setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
  };

  const deleteContract = async (id: string) => {
    if (!confirm("Excluir este contrato?")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = statusFilter === "ALL" ? contracts : contracts.filter((c) => c.status === statusFilter);
  const counts: Record<string, number> = { ALL: contracts.length };
  contracts.forEach((c) => { counts[c.status] = (counts[c.status] ?? 0) + 1; });

  const totalActive = contracts.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + c.monthlyAmount, 0);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/contratos" title="Contratos">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Contratos ativos</p>
          <p className="text-2xl font-bold" style={{ color: P.primary }}>{counts["ACTIVE"] ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Receita mensal ativa</p>
          <p className="text-xl font-bold text-green-600">{formatBRL(totalActive)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Aguardando assinatura</p>
          <p className="text-2xl font-bold text-amber-500">{counts["PENDING_SIGNATURE"] ?? 0}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["ALL", "ACTIVE", "PENDING_SIGNATURE", "EXPIRED", "CANCELLED"] as const).map((s) => {
          const count = counts[s] ?? 0;
          if (count === 0 && s !== "ALL") return null;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
              style={statusFilter === s
                ? { background: P.primary, color: "#fff" }
                : { background: "#fff", color: P.primary, border: `1px solid ${P.light}` }}>
              {s === "ALL" ? `Todos (${count})` : `${statusCfg[s].label} (${count})`}
            </button>
          );
        })}
        <button onClick={() => { setEditingContract(null); setShowForm(true); }}
          className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center py-20 text-gray-400">
          <ClipboardList size={40} className="opacity-20 mb-3" />
          <p className="font-medium">{contracts.length === 0 ? "Nenhum contrato criado" : "Nenhum contrato neste filtro"}</p>
          {contracts.length === 0 && (
            <button onClick={() => { setEditingContract(null); setShowForm(true); }}
              className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 text-white" style={{ background: P.primary }}>
              Criar primeiro contrato
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: P.bg, borderBottom: `1px solid ${P.light}` }}>
                {["Contrato", "Cliente", "Valor/mês", "Vigência", "Reajuste", "Status", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.primary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#F9F3EF] transition-colors"
                  style={{ borderTop: idx > 0 ? `1px solid ${P.light}30` : undefined }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm" style={{ color: P.primary }}>{c.title}</p>
                    <p className="text-xs text-gray-400">Criado em {formatDate(c.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.client.name}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: P.primary }}>{formatBRL(c.monthlyAmount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{formatDate(c.startDate)}</p>
                    {c.endDate && <p className="text-gray-400">até {formatDate(c.endDate)}</p>}
                    <ExpiringWarning endDate={c.endDate} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.adjustmentIndex ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {c.status === "PENDING_SIGNATURE" && (
                        <button onClick={() => changeStatus(c.id, "ACTIVE")}
                          className="text-xs rounded-lg px-2 py-1 font-medium hover:bg-green-50 transition-colors"
                          style={{ color: "#22c55e", border: "1px solid #22c55e" }}>
                          Assinar
                        </button>
                      )}
                      {c.status === "ACTIVE" && (
                        <button onClick={() => changeStatus(c.id, "CANCELLED")}
                          className="text-xs rounded-lg px-2 py-1 font-medium hover:bg-red-50 transition-colors"
                          style={{ color: "#ef4444", border: "1px solid #ef4444" }}>
                          Cancelar
                        </button>
                      )}
                      <button onClick={() => { setEditingContract(c); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteContract(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ContractModal
          clients={clients}
          contract={editingContract}
          onClose={() => { setShowForm(false); setEditingContract(null); }}
          onSave={() => { setShowForm(false); setEditingContract(null); load(); }}
        />
      )}
    </AppShell>
  );
}
