"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  Users, Plus, Search, Edit2, Trash2, X, ChevronDown,
  Mail, Phone, MapPin, Building2, FileText,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  companyName: string | null;
  createdAt: string;
  _count: { proposals: number; calculations: number };
}

type ClientForm = {
  name: string; email: string; cpf: string; phone: string;
  address: string; city: string; state: string; zipCode: string;
  companyName: string; companyCnpj: string; companyContact: string; notes: string;
};

const emptyForm: ClientForm = {
  name: "", email: "", cpf: "", phone: "",
  address: "", city: "", state: "", zipCode: "",
  companyName: "", companyCnpj: "", companyContact: "", notes: "",
};

function Field({ label, value, onChange, required, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>
        {label}{required && " *"}
      </label>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        style={{ borderColor: P.light }}
      />
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: {
  client: Client | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<ClientForm>(client ? {
    name: client.name,
    email: client.email ?? "",
    cpf: "",
    phone: client.phone ?? "",
    address: "",
    city: client.city ?? "",
    state: client.state ?? "",
    zipCode: "",
    companyName: client.companyName ?? "",
    companyCnpj: "",
    companyContact: "",
    notes: "",
  } : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ClientForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          cpf: form.cpf || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zipCode: form.zipCode || undefined,
          companyName: form.companyName || undefined,
          companyCnpj: form.companyCnpj || undefined,
          companyContact: form.companyContact || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar.");
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: P.light }}>
          <h2 className="font-bold text-lg" style={{ color: P.primary }}>
            {client ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#94a3b8" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: P.mid }}>Dados Pessoais</p>
          <Field label="Nome completo" value={form.name} onChange={(v) => set("name", v)} required placeholder="João da Silva" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail" value={form.email} onChange={(v) => set("email", v)} type="email" placeholder="joao@email.com" />
            <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="(11) 99999-9999" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF" value={form.cpf} onChange={(v) => set("cpf", v)} placeholder="000.000.000-00" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest pt-2" style={{ color: P.mid }}>Endereço</p>
          <Field label="Endereço" value={form.address} onChange={(v) => set("address", v)} placeholder="Rua, número, bairro" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} placeholder="São Paulo" />
            </div>
            <Field label="UF" value={form.state} onChange={(v) => set("state", v)} placeholder="SP" />
          </div>
          <Field label="CEP" value={form.zipCode} onChange={(v) => set("zipCode", v)} placeholder="00000-000" />

          <p className="text-xs font-bold uppercase tracking-widest pt-2" style={{ color: P.mid }}>Empresa (opcional)</p>
          <Field label="Nome da empresa" value={form.companyName} onChange={(v) => set("companyName", v)} placeholder="Solar Energia LTDA" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ" value={form.companyCnpj} onChange={(v) => set("companyCnpj", v)} placeholder="00.000.000/0001-00" />
            <Field label="Contato empresa" value={form.companyContact} onChange={(v) => set("companyContact", v)} placeholder="(11) 3333-4444" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest pt-2" style={{ color: P.mid }}>Observações</p>
          <textarea
            value={form.notes} onChange={(e) => set("notes", e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            style={{ borderColor: P.light }} rows={3} placeholder="Notas adicionais..."
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: P.light, color: P.primary }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando..." : client ? "Salvar alterações" : "Criar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({ client, onClose, onDeleted }: {
  client: Client; onClose: () => void; onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    onDeleted();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-lg mb-2" style={{ color: P.primary }}>Excluir cliente?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir <strong>{client.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-semibold border hover:bg-gray-50" style={{ borderColor: P.light }}>
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
            style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const wide = isExpanded || isHovered;
  const sideW = wide ? 280 : 72;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const d = await res.json();
      setClients(d.clients ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AppShell active="/clientes" title="Clientes">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cidade..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: P.light }}
          />
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: P.primary }}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total de clientes", value: clients.length, color: P.primary },
          { label: "Total de propostas", value: clients.reduce((s, c) => s + c._count.proposals, 0), color: "#22c55e" },
          { label: "Total de cálculos", value: clients.reduce((s, c) => s + c._count.calculations, 0), color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users size={40} className="opacity-20 mb-3" />
            <p className="font-medium">{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
            {!search && (
              <button onClick={() => { setEditingClient(null); setShowForm(true); }}
                className="mt-4 text-sm font-semibold rounded-lg px-4 py-2 text-white"
                style={{ background: P.primary }}>
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: P.bg, borderBottom: `1px solid ${P.light}` }}>
                  {["Cliente", "Contato", "Localização", "Empresa", "Propostas", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: P.primary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, idx) => (
                  <tr key={client.id}
                    className="hover:bg-[#F9F3EF] transition-colors"
                    style={{ borderTop: idx > 0 ? `1px solid ${P.light}30` : undefined }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: P.primary }}>
                          {client.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: P.primary }}>{client.name}</p>
                          <p className="text-xs text-gray-400">
                            Desde {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                          <Mail size={12} /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone size={12} /> {client.phone}
                        </div>
                      )}
                      {!client.email && !client.phone && <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {client.city ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin size={12} /> {client.city}{client.state ? ` - ${client.state}` : ""}
                        </div>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {client.companyName ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Building2 size={12} /> {client.companyName}
                        </div>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="rounded-full px-2 py-0.5 font-semibold"
                          style={{ background: "#1B3C5318", color: P.primary }}>
                          {client._count.proposals} prop.
                        </span>
                        <span className="rounded-full px-2 py-0.5 font-semibold"
                          style={{ background: "#f59e0b18", color: "#92400e" }}>
                          {client._count.calculations} cálc.
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/proposta?clientId=${client.id}`)}
                          title="Nova proposta"
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-green-600">
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => { setEditingClient(client); setShowForm(true); }}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600">
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingClient(client)}
                          title="Excluir"
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500">
                          <Trash2 size={15} />
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
        <ClientModal
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSave={() => { setShowForm(false); setEditingClient(null); load(); }}
        />
      )}
      {deletingClient && (
        <DeleteDialog
          client={deletingClient}
          onClose={() => setDeletingClient(null)}
          onDeleted={() => { setDeletingClient(null); load(); }}
        />
      )}
    </AppShell>
  );
}
