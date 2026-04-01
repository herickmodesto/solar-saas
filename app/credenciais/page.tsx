"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { AppShell } from "@/components/AppShell";
import {
  Plug, CheckCircle, XCircle, Trash2, Eye, EyeOff, Save,
} from "lucide-react";

const P = { primary: "#1B3C53", mid: "#456882", light: "#D2C1B6", bg: "#F9F3EF" };

type ProviderKey =
  | "GROWATT" | "SOLIS" | "DEYE" | "FRONIUS" | "HUAWEI_FUSIONSOLAR"
  | "WEG" | "ABB" | "SOFAR" | "GOODWE" | "CUSTOM"
  | "SUNGROW" | "SOLPLANET" | "HOYMILES" | "NEP" | "SOLARMAN"
  | "ELEKEEPER" | "KEHUA" | "INTELBRAS" | "CHINT";

interface ProviderConfig {
  label: string;
  authType: "userpass" | "apikey" | "apikey+secret";
  serverUrl?: boolean;
  color: string;
}

const PROVIDERS: Record<ProviderKey, ProviderConfig> = {
  GROWATT:           { label: "Growatt",            authType: "userpass",       color: "#16a34a" },
  SOLIS:             { label: "Solis Cloud",         authType: "apikey+secret",  color: "#0ea5e9" },
  DEYE:              { label: "Deye Cloud",          authType: "apikey+secret",  color: "#f59e0b" },
  FRONIUS:           { label: "Fronius Solar.web",   authType: "userpass",       serverUrl: true, color: "#ef4444" },
  HUAWEI_FUSIONSOLAR:{ label: "Huawei FusionSolar",  authType: "userpass",       color: "#dc2626" },
  WEG:               { label: "WEG WeWee",           authType: "userpass",       color: "#7c3aed" },
  ABB:               { label: "ABB Ability",         authType: "apikey",         color: "#b45309" },
  SOFAR:             { label: "Sofar Solar",         authType: "userpass",       color: "#0891b2" },
  GOODWE:            { label: "GoodWe / WEG",        authType: "userpass",       color: "#d97706" },
  SUNGROW:           { label: "Sungrow API",         authType: "userpass",       color: "#f97316" },
  SOLPLANET:         { label: "Solplanet Pro API",   authType: "apikey+secret",  color: "#8b5cf6" },
  HOYMILES:          { label: "Hoymiles",            authType: "userpass",       color: "#06b6d4" },
  NEP:               { label: "NEP Viewer",          authType: "userpass",       color: "#10b981" },
  SOLARMAN:          { label: "Solar Man Business",  authType: "userpass",       color: "#f59e0b" },
  ELEKEEPER:         { label: "elekeeper",           authType: "userpass",       color: "#64748b" },
  KEHUA:             { label: "Kehua Agent",         authType: "userpass",       color: "#dc2626" },
  INTELBRAS:         { label: "Intelbras Solar",     authType: "userpass",       color: "#1d4ed8" },
  CHINT:             { label: "Chint FlexOM API",    authType: "apikey",         color: "#7c3aed" },
  CUSTOM:            { label: "Personalizado",       authType: "apikey",         serverUrl: true, color: "#6b7280" },
};

interface SavedCredential {
  id: string;
  provider: ProviderKey;
  username: string | null;
  isActive: boolean;
  lastTestAt: string | null;
}

interface FormState {
  username: string;
  password: string;
  apiKey: string;
  apiSecret: string;
  serverUrl: string;
}

const emptyForm = (): FormState => ({ username: "", password: "", apiKey: "", apiSecret: "", serverUrl: "" });

function CredentialCard({
  providerKey,
  saved,
  onSaved,
  onDeleted,
}: {
  providerKey: ProviderKey;
  saved: SavedCredential | undefined;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const cfg = PROVIDERS[providerKey];
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/monitoring-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerKey,
          ...(form.username ? { username: form.username } : {}),
          ...(form.password ? { password: form.password } : {}),
          ...(form.apiKey ? { apiKey: form.apiKey } : {}),
          ...(form.apiSecret ? { apiSecret: form.apiSecret } : {}),
          ...(form.serverUrl ? { serverUrl: form.serverUrl } : {}),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro."); }
      setSuccess("Credencial salva com sucesso!");
      setForm(emptyForm());
      setExpanded(false);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remover credencial do ${cfg.label}?`)) return;
    setDeleting(true);
    await fetch(`/api/monitoring-credentials?provider=${providerKey}`, { method: "DELETE" });
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0"
            style={{ background: cfg.color }}>
            {cfg.label[0]}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: P.primary }}>{cfg.label}</p>
            <p className="text-xs text-gray-400">
              {saved
                ? `Configurado${saved.username ? ` • ${saved.username}` : ""}`
                : "Não configurado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved ? (
            <>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle size={14} /> Ativo
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
              <XCircle size={14} /> Inativo
            </span>
          )}
          <div className="w-5 text-gray-400 text-xs">{expanded ? "▲" : "▼"}</div>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <form onSubmit={handleSave} className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: P.light }}>
          <p className="text-xs text-gray-500">
            {saved ? "Atualizar credenciais de acesso:" : "Informe suas credenciais de acesso:"}
          </p>

          {(cfg.authType === "userpass") && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: P.mid }}>Usuário / E-mail</label>
                <input value={form.username} onChange={(e) => set("username", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: P.light }}
                  placeholder="seu@email.com" />
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: P.mid }}>Senha</label>
                <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none" style={{ borderColor: P.light }} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-7 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          )}

          {(cfg.authType === "apikey" || cfg.authType === "apikey+secret") && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: P.mid }}>API Key</label>
                <input value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none font-mono" style={{ borderColor: P.light }}
                  placeholder="Sua API Key..." />
              </div>
              {cfg.authType === "apikey+secret" && (
                <div className="relative">
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: P.mid }}>API Secret</label>
                  <input type={showPass ? "text" : "password"} value={form.apiSecret} onChange={(e) => set("apiSecret", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none font-mono" style={{ borderColor: P.light }} />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-7 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </>
          )}

          {cfg.serverUrl && (
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: P.mid }}>URL do Servidor</label>
              <input value={form.serverUrl} onChange={(e) => set("serverUrl", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: P.light }}
                placeholder="https://..." />
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white w-full justify-center"
            style={{ background: P.primary, opacity: saving ? 0.7 : 1 }}>
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar credencial"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function CredenciaisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();

  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/monitoring-credentials");
    if (res.ok) { const d = await res.json(); setCredentials(d.credentials ?? []); }
    setLoading(false);
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  const savedByProvider = Object.fromEntries(credentials.map((c) => [c.provider, c])) as Record<ProviderKey, SavedCredential | undefined>;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: P.primary, borderTopColor: "transparent" }} />
      </div>
    );
  }

  const configuredCount = credentials.length;

  return (
    <AppShell active="/credenciais" title="Portais de Monitoramento">
      {/* Info bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: P.primary + "15" }}>
          <Plug size={20} color={P.primary} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: P.primary }}>
            {configuredCount === 0
              ? "Nenhum portal configurado"
              : `${configuredCount} portal(is) configurado(s)`}
          </p>
          <p className="text-xs text-gray-400">
            Configure suas credenciais para que o sistema possa sincronizar usinas e monitorar geração automaticamente.
          </p>
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(PROVIDERS) as ProviderKey[]).map((key) => (
          <CredentialCard
            key={key}
            providerKey={key}
            saved={savedByProvider[key]}
            onSaved={load}
            onDeleted={load}
          />
        ))}
      </div>
    </AppShell>
  );
}
