"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppSidebar, AppHeader } from "@/components/AppShell";
import {
  Zap, Plus, RefreshCw, X, CheckCircle, AlertTriangle, XCircle, HelpCircle,
  MapPin, Edit2, Trash2, BarChart, Sun, Menu, ChevronRight, Upload, ExternalLink,
} from "lucide-react";
import type { Plant, PlantStatus, Client } from "@/types";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Palette ───────────────────────────────────────────────────
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

// ── Form Modal ────────────────────────────────────────────────
type PlantForm = {
  name: string; clientId: string; growattPlantId: string;
  city: string; state: string; address: string;
  systemKwp: string; latitude: string; longitude: string; installDate: string;
};

const emptyForm: PlantForm = {
  name: "", clientId: "", growattPlantId: "", city: "", state: "",
  address: "", systemKwp: "", latitude: "", longitude: "", installDate: "",
};

function PlantFormModal({ plant, clients, onClose, onSave }: {
  plant: Plant | null; clients: Client[]; onClose: () => void;
  onSave: (data: PlantForm) => Promise<void>;
}) {
  const [form, setForm] = useState<PlantForm>(plant ? {
    name: plant.name,
    clientId: plant.clientId ?? "",
    growattPlantId: plant.growattPlantId ?? "",
    city: plant.city ?? "",
    state: plant.state ?? "",
    address: plant.address ?? "",
    systemKwp: plant.systemKwp?.toString() ?? "",
    latitude: plant.latitude?.toString() ?? "",
    longitude: plant.longitude?.toString() ?? "",
    installDate: plant.installDate ? plant.installDate.split("T")[0] : "",
  } : emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof PlantForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: P.light }}>
          <h2 className="font-bold text-lg" style={{ color: P.primary }}>
            {plant ? "Editar Usina" : "Nova Usina"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#94a3b8" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Nome da Usina *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: P.light }} placeholder="Ex: USINA_JOAOSILVA" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Cliente</label>
            <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: P.light }}>
              <option value="">— Sem cliente vinculado —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>ID Growatt</label>
            <input value={form.growattPlantId} onChange={(e) => set("growattPlantId", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: P.light }} placeholder="ID numérico da planta no Growatt" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Cidade</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Estado</label>
              <input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} placeholder="RN" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Endereço</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Potência (kWp)</label>
              <input type="number" step="0.01" value={form.systemKwp} onChange={(e) => set("systemKwp", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Data Instalação</label>
              <input type="date" value={form.installDate} onChange={(e) => set("installDate", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} placeholder="-5.7945" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: P.mid }}>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ borderColor: P.light }} placeholder="-35.2110" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: P.light, color: P.mid }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all"
              style={{ background: P.primary, color: "#fff", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Salvando..." : plant ? "Salvar Alterações" : "Criar Usina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────
function PlantDrawer({ plant, onClose, onEdit, onDelete, sideW }: {
  plant: Plant; onClose: () => void; onEdit: () => void; onDelete: () => void; sideW: number;
}) {
  const [monitoring, setMonitoring] = useState<{
    currentKw: number; todayKwh: number; monthKwh: number; yearKwh: number;
  } | null>(null);
  const [loadingMon, setLoadingMon] = useState(false);

  useEffect(() => {
    if (!plant.growattPlantId) return;
    setLoadingMon(true);
    fetch(`/api/plants/${plant.id}/monitoring`)
      .then((r) => r.json())
      .then((d) => setMonitoring(d.monitoring))
      .finally(() => setLoadingMon(false));
  }, [plant.id, plant.growattPlantId]);

  const energyData = monitoring ? [
    { name: "Hoje", kWh: monitoring.todayKwh },
    { name: "Mês", kWh: monitoring.monthKwh },
    { name: "Ano", kWh: monitoring.yearKwh },
  ] : [];

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto no-scrollbar"
        style={{ borderLeft: `1px solid ${P.light}` }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: P.light }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: P.primary + "15" }}>
              <Sun size={18} color={P.primary} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: P.primary }}>{plant.name}</h2>
              {plant.city && <p className="text-xs text-gray-400">{plant.city}{plant.state ? ` - ${plant.state}` : ""}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: statusColor[plant.status] + "18", color: statusColor[plant.status] }}>
            <StatusIcon status={plant.status} />
            {statusLabel[plant.status]}
          </span>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Potência", value: plant.systemKwp ? `${plant.systemKwp} kWp` : "—" },
              { label: "Cliente", value: plant.client?.name ?? "—" },
              { label: "Growatt ID", value: plant.growattPlantId ?? "Não vinculado" },
              { label: "Instalação", value: plant.installDate ? new Date(plant.installDate).toLocaleDateString("pt-BR") : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: P.bg }}>
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                <p className="font-semibold text-sm" style={{ color: P.primary }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Real-time monitoring */}
          {plant.growattPlantId && (
            <div>
              <h3 className="font-semibold text-sm mb-3" style={{ color: P.primary }}>Monitoramento Growatt</h3>
              {loadingMon ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
                </div>
              ) : monitoring ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Potência Atual", value: `${monitoring.currentKw.toFixed(2)} kW` },
                      { label: "Geração Hoje", value: `${monitoring.todayKwh.toFixed(1)} kWh` },
                      { label: "Este Mês", value: `${monitoring.monthKwh.toFixed(1)} kWh` },
                      { label: "Este Ano", value: `${monitoring.yearKwh.toFixed(1)} kWh` },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg p-3 border" style={{ borderColor: P.light }}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                        <p className="font-bold" style={{ color: P.primary }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <ReBarChart data={energyData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(1)} kWh`]} />
                      <Bar dataKey="kWh" fill={P.primary} radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Dados não disponíveis</p>
              )}
            </div>
          )}

          {/* Devices */}
          {plant.devices && plant.devices.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3" style={{ color: P.primary }}>Inversores ({plant.devices.length})</h3>
              <div className="space-y-2">
                {plant.devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: P.bg }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: P.primary }}>{d.brand} {d.model ?? ""}</p>
                      <p className="text-xs text-gray-400">SN: {d.serialNumber}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: d.currentKw ? "#22c55e" : "#94a3b8" }}>
                      {d.currentKw ? `${d.currentKw.toFixed(2)} kW` : "Offline"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active alerts */}
          {plant.alerts && plant.alerts.filter((a) => !a.isResolved).length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 text-amber-600">Alertas Ativos</h3>
              <div className="space-y-2">
                {plant.alerts.filter((a) => !a.isResolved).map((a) => (
                  <div key={a.id} className="rounded-lg p-3 border-l-4"
                    style={{ background: "#fff7ed", borderLeftColor: a.alertType === "FAULT" ? "#ef4444" : "#f59e0b" }}>
                    <p className="text-sm font-medium text-amber-800">{a.message}</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {new Date(a.occurredAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map link */}
          {plant.latitude && plant.longitude && (
            <a href={`https://www.google.com/maps?q=${plant.latitude},${plant.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: P.mid }}>
              <MapPin size={16} /> Ver no Google Maps
            </a>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: P.light, color: P.primary }}>
              <Edit2 size={15} /> Editar
            </button>
            <button onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
              style={{ borderColor: "#fca5a5", color: "#ef4444" }}>
              <Trash2 size={15} /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Usinas Page ──────────────────────────────────────────
function UsinasContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar, toggleSidebar } = useSidebar();

  const wide = isExpanded || isHovered || isMobileOpen;
  const sideW = wide ? 280 : 72;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const importRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const load = async () => {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([fetch("/api/plants"), fetch("/api/clients")]);
      if (pRes.ok) { const d = await pRes.json(); setPlants(d.plants ?? []); }
      if (cRes.ok) { const d = await cRes.json(); setClients(d.clients ?? []); }
      setLoading(false);
    };
    load();
  }, [status]);

  // Handle ?id= and ?edit= params
  useEffect(() => {
    const id = searchParams.get("id");
    const edit = searchParams.get("edit");
    if (plants.length === 0) return;
    if (id) { const p = plants.find((x) => x.id === id); if (p) setDetailPlant(p); }
    if (edit) { const p = plants.find((x) => x.id === edit); if (p) { setEditingPlant(p); setShowForm(true); } }
  }, [searchParams, plants]);

  const refreshPlants = async () => {
    const r = await fetch("/api/plants");
    if (r.ok) { const d = await r.json(); setPlants(d.plants ?? []); }
  };

  const handleSave = async (form: { name: string; clientId: string; growattPlantId: string; city: string; state: string; address: string; systemKwp: string; latitude: string; longitude: string; installDate: string; }) => {
    const body = {
      name: form.name,
      clientId: form.clientId || null,
      growattPlantId: form.growattPlantId || null,
      city: form.city || null,
      state: form.state || null,
      address: form.address || null,
      systemKwp: form.systemKwp ? parseFloat(form.systemKwp) : null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      installDate: form.installDate || null,
    };
    if (editingPlant) {
      await fetch(`/api/plants/${editingPlant.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/plants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    await refreshPlants();
    setShowForm(false);
    setEditingPlant(null);
  };

  const handleDelete = async (plant: Plant) => {
    if (!confirm(`Excluir "${plant.name}"?`)) return;
    await fetch(`/api/plants/${plant.id}`, { method: "DELETE" });
    setDetailPlant(null);
    await refreshPlants();
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch("/api/plants/sync", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      if (d.unregistered?.length > 0) {
        alert(`${d.unregistered.length} usina(s) Growatt não registradas. Acesse o console para ver os IDs.`);
        console.log("Usinas Growatt não cadastradas:", d.unregistered);
      }
    }
    await refreshPlants();
    setSyncing(false);
  };

  const filtered = plants.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      <AppSidebar active="/usinas" />

      {/* Header */}
      <header className="fixed top-0 right-0 z-20 flex items-center gap-4 px-6 bg-white border-b"
        style={{ left: sideW, height: 64, transition: "left 0.25s ease", borderColor: "#e8e0d8" }}>
        <button onClick={toggleMobileSidebar} className="lg:hidden text-gray-500"><Menu size={22} /></button>
        {!isExpanded && !isHovered && (
          <button onClick={toggleSidebar} className="hidden lg:flex text-gray-400 hover:text-gray-600">
            <ChevronRight size={20} />
          </button>
        )}
        <h1 className="font-semibold text-lg" style={{ color: P.primary }}>Gerenciar Usinas</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white"
            style={{ background: P.primary }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>
      </header>

      <main style={{ marginLeft: sideW, paddingTop: 64, transition: "margin-left 0.25s ease" }} className="p-6">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usinas, clientes, cidades..."
            className="border rounded-lg px-4 py-2.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2"
            style={{ borderColor: P.light }} />
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border"
            style={{ borderColor: P.light, color: P.primary, background: "#fff", opacity: syncing ? 0.7 : 1 }}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando..." : "Sincronizar Growatt"}
          </button>
          <button onClick={() => importRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border"
            style={{ borderColor: P.light, color: P.primary, background: "#fff", opacity: importing ? 0.7 : 1 }}>
            <Upload size={16} />
            {importing ? "Importando..." : "Importar Planilha"}
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.csv,.xls" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImporting(true);
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/plants/import", { method: "POST", body: fd });
              const d = await res.json();
              if (res.ok) {
                alert(`✅ ${d.created} usina(s) criada(s). ${d.skipped} ignorada(s)${d.errors?.length ? `\nErros: ${d.errors.join(", ")}` : ""}`);
                await refreshPlants();
              } else {
                alert(`Erro: ${d.error}`);
              }
              setImporting(false);
              e.target.value = "";
            }} />
          <button onClick={() => { setEditingPlant(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            style={{ background: P.primary, color: "#fff" }}>
            <Plus size={16} /> Nova Usina
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: plants.length, color: P.primary },
            { label: "Normal", value: plants.filter((p) => p.status === "NORMAL").length, color: "#22c55e" },
            { label: "Com Alerta", value: plants.filter((p) => p.status === "ALERT" || p.status === "CRITICAL").length, color: "#f59e0b" },
            { label: "Total kWp", value: `${plants.reduce((s, p) => s + (p.systemKwp ?? 0), 0).toFixed(1)}`, color: P.mid },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-solid-3 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Plants grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-solid-3 flex flex-col items-center justify-center py-20 gap-4">
            <Zap size={48} className="opacity-20" color={P.primary} />
            <p className="font-medium text-gray-500">
              {search ? "Nenhuma usina encontrada" : "Nenhuma usina cadastrada"}
            </p>
            {!search && (
              <button onClick={() => { setEditingPlant(null); setShowForm(true); }}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                style={{ background: P.primary, color: "#fff" }}>
                <Plus size={16} /> Cadastrar Primeira Usina
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((plant) => (
              <div key={plant.id}
                className="bg-white rounded-xl shadow-solid-3 p-5 cursor-pointer transition-all hover:shadow-solid-4 hover:-translate-y-0.5"
                onClick={() => setDetailPlant(plant)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: P.primary + "15" }}>
                      <Sun size={20} color={P.primary} />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: P.primary }}>{plant.name}</p>
                      <p className="text-xs text-gray-400">
                        {plant.city ? `${plant.city}${plant.state ? ` - ${plant.state}` : ""}` : "Sem localização"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
                    style={{ background: statusColor[plant.status] + "18", color: statusColor[plant.status] }}>
                    <StatusIcon status={plant.status} />
                    {statusLabel[plant.status]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                    <p className="text-xs text-gray-500">kWp</p>
                    <p className="font-bold text-sm" style={{ color: P.primary }}>{plant.systemKwp ?? "—"}</p>
                  </div>
                  <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                    <p className="text-xs text-gray-500">Inversores</p>
                    <p className="font-bold text-sm" style={{ color: P.primary }}>{plant._count?.devices ?? 0}</p>
                  </div>
                  <div className="text-center rounded-lg p-2" style={{ background: P.bg }}>
                    <p className="text-xs text-gray-500">Alertas</p>
                    <p className="font-bold text-sm" style={{ color: plant._count?.alerts ? "#f59e0b" : "#94a3b8" }}>
                      {plant._count?.alerts ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <BarChart size={13} />
                    {plant.lastSyncAt
                      ? `Sync: ${new Date(plant.lastSyncAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                      : "Nunca sincronizado"}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/usinas/${plant.id}`); }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Ver detalhes">
                      <ExternalLink size={14} color="#3b82f6" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingPlant(plant); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <Edit2 size={14} color={P.mid} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(plant); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form modal */}
      {showForm && (
        <PlantFormModal
          plant={editingPlant}
          clients={clients}
          onClose={() => { setShowForm(false); setEditingPlant(null); }}
          onSave={handleSave}
        />
      )}

      {/* Detail drawer */}
      {detailPlant && (
        <PlantDrawer
          plant={detailPlant}
          sideW={sideW}
          onClose={() => setDetailPlant(null)}
          onEdit={() => { setEditingPlant(detailPlant); setDetailPlant(null); setShowForm(true); }}
          onDelete={() => handleDelete(detailPlant)}
        />
      )}
    </div>
  );
}

export default function UsinasPage() {
  return (
    <Suspense>
      <UsinasContent />
    </Suspense>
  );
}
