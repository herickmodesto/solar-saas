"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  LifeBuoy, Plus, X, Send, ChevronDown, Trash2,
  AlertCircle, AlertTriangle, Info, CheckCircle2,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface TicketMessage { id: string; content: string; isStaff: boolean; createdAt: string; }
interface Ticket {
  id: string; title: string; description: string;
  status: TicketStatus; priority: TicketPriority;
  category: string | null; assignedTo: string | null;
  createdAt: string; updatedAt: string; resolvedAt: string | null;
  client: { id: string; name: string } | null;
  messages?: TicketMessage[];
  _count?: { messages: number };
}

const statusCfg: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  OPEN:        { label: "Aberto",       color: "#3b82f6", bg: "#dbeafe" },
  IN_PROGRESS: { label: "Em andamento", color: "#f59e0b", bg: "#fef3c7" },
  RESOLVED:    { label: "Resolvido",    color: "#22c55e", bg: "#dcfce7" },
  CLOSED:      { label: "Fechado",      color: "#6b7280", bg: "#f3f4f6" },
};
const priorityCfg: Record<TicketPriority, { label: string; color: string; Icon: React.ElementType }> = {
  LOW:      { label: "Baixa",    color: "#6b7280", Icon: Info },
  MEDIUM:   { label: "Média",    color: "#3b82f6", Icon: AlertCircle },
  HIGH:     { label: "Alta",     color: "#f59e0b", Icon: AlertTriangle },
  CRITICAL: { label: "Crítica",  color: "#ef4444", Icon: AlertCircle },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = statusCfg[status];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
  );
}
function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = priorityCfg[priority];
  const Icon = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: cfg.color }}>
      <Icon size={12} />{cfg.label}
    </span>
  );
}

function NewTicketModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as TicketPriority, category: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description, priority: form.priority, category: form.category || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro ao criar."); }
      onSave();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: P.light }}>
          <h2 className="font-bold text-lg" style={{ color: P.primary }}>Novo Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} color="#94a3b8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Título *</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}
              placeholder="Descreva brevemente o problema..." />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Descrição *</label>
            <textarea required value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{ borderColor: P.light }} rows={4} placeholder="Detalhe o problema ou solicitação..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Prioridade</label>
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Categoria</label>
              <input value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }}
                placeholder="Ex: Cobrança, Técnico..." />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-semibold border hover:bg-gray-50" style={{ borderColor: P.light }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Criando..." : "Abrir ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, onClose, onUpdated }: {
  ticket: Ticket; onClose: () => void; onUpdated: (t: Ticket) => void;
}) {
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/tickets/${ticket.id}`).then((r) => r.json()).then((d) => { setDetail(d.ticket); setLoading(false); });
  }, [ticket.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [detail?.messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: message }),
    });
    if (res.ok) {
      const d = await res.json();
      setDetail((prev) => prev ? { ...prev, messages: [...(prev.messages ?? []), d.message], status: "IN_PROGRESS" } : prev);
      setMessage("");
    }
    setSending(false);
  };

  const changeStatus = async (status: TicketStatus) => {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const d = await res.json();
      setDetail((prev) => prev ? { ...prev, status: d.ticket.status } : prev);
      onUpdated(d.ticket);
    }
  };

  const t = detail ?? ticket;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: P.light }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              {t.category && <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{t.category}</span>}
            </div>
            <h3 className="font-bold text-base" style={{ color: P.primary }}>{t.title}</h3>
            {t.client && <p className="text-xs text-gray-500 mt-0.5">Cliente: {t.client.name}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 shrink-0"><X size={18} color="#94a3b8" /></button>
        </div>

        {/* Description */}
        <div className="px-5 py-3 text-sm text-gray-700 border-b bg-gray-50" style={{ borderColor: P.light }}>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Descrição</p>
          <p>{t.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} /></div>
          ) : (detail?.messages ?? []).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Nenhuma mensagem. Envie uma atualização abaixo.</p>
          ) : (detail?.messages ?? []).map((msg) => (
            <div key={msg.id} className={`flex ${msg.isStaff ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                style={msg.isStaff
                  ? { background: P.bg, color: P.primary }
                  : { background: P.primary, color: "#fff" }}>
                <p>{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Send */}
        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2" style={{ borderColor: P.light }}>
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: P.light }} />
          <button type="submit" disabled={sending || !message.trim()}
            className="p-2.5 rounded-lg text-white transition-colors"
            style={{ background: P.primary, opacity: !message.trim() ? 0.4 : 1 }}>
            <Send size={18} />
          </button>
        </form>

        {/* Status actions */}
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {t.status !== "RESOLVED" && (
            <button onClick={() => changeStatus("RESOLVED")}
              className="text-xs rounded-full px-3 py-1.5 font-medium transition-colors"
              style={{ background: "#dcfce7", color: "#16a34a" }}>
              <CheckCircle2 size={12} className="inline mr-1" />Marcar resolvido
            </button>
          )}
          {t.status !== "CLOSED" && (
            <button onClick={() => changeStatus("CLOSED")}
              className="text-xs rounded-full px-3 py-1.5 font-medium"
              style={{ background: "#f3f4f6", color: "#6b7280" }}>
              Fechar ticket
            </button>
          )}
          {(t.status === "RESOLVED" || t.status === "CLOSED") && (
            <button onClick={() => changeStatus("OPEN")}
              className="text-xs rounded-full px-3 py-1.5 font-medium"
              style={{ background: "#dbeafe", color: "#1d4ed8" }}>
              Reabrir ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/tickets");
    if (res.ok) { const d = await res.json(); setTickets(d.tickets ?? []); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const deleteTicket = async (id: string) => {
    if (!confirm("Excluir este ticket?")) return;
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = statusFilter === "ALL" ? tickets : tickets.filter((t) => t.status === statusFilter);

  const counts: Record<string, number> = { ALL: tickets.length };
  tickets.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/tickets" title="Tickets de Suporte">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((s) => {
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
        <button onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={16} /> Novo Ticket
        </button>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center py-20 text-gray-400">
          <LifeBuoy size={40} className="opacity-20 mb-3" />
          <p className="font-medium">{tickets.length === 0 ? "Nenhum ticket aberto" : "Nenhum ticket neste filtro"}</p>
          {tickets.length === 0 && (
            <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 text-white" style={{ background: P.primary }}>
              Abrir primeiro ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div key={ticket.id}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {ticket.category && (
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{ticket.category}</span>
                    )}
                  </div>
                  <p className="font-semibold truncate" style={{ color: P.primary }}>{ticket.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {ticket.client && <span>Cliente: {ticket.client.name}</span>}
                    <span>{ticket._count?.messages ?? 0} mensagem(ns)</span>
                    <span>Atualizado: {new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NewTicketModal
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={(updated) => {
            setTickets((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
            setSelectedTicket((prev) => prev ? { ...prev, ...updated } : prev);
          }}
        />
      )}
    </AppShell>
  );
}
