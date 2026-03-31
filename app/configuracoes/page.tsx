"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
  { href: "/proposta", label: "Propostas", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg> },
  { href: "/calculadora", label: "Calculadora", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" /></svg> },
  { href: "/analise-mensal", label: "Análise Mensal", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
];

const settingsSections = [
  { id: "perfil", label: "Perfil Pessoal" },
  { id: "assinatura", label: "Assinatura" },
  { id: "seguranca", label: "Segurança" },
  { id: "perigo", label: "Zona de Perigo" },
];

interface SubInfo { plan: string; status: string; rawStatus: string; endsAt: string | null; }
interface UserProfile { name: string; email: string; companyName: string | null; companyCnpj: string | null; phone: string | null; emailVerified: boolean; provider: string; }

export default function Configuracoes() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState("perfil");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Perfil edit state
  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editCompany, setEditCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Senha state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetch("/api/me/subscription").then(r => r.json()).then(setSub).catch(() => {});
    fetch("/api/me/profile").then(r => r.json()).then(d => {
      if (d.user) {
        setProfile(d.user);
        setNameValue(d.user.name ?? "");
        setCompanyName(d.user.companyName ?? "");
        setCompanyCnpj(d.user.companyCnpj ?? "");
        setCompanyPhone(d.user.phone ?? "");
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { if (editName && nameInputRef.current) nameInputRef.current.focus(); }, [editName]);

  const userName = profile?.name ?? session?.user?.name ?? "Usuário";
  const userEmail = profile?.email ?? session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();
  const planLabel = sub?.plan ?? "Free Plan";
  const statusLabel = sub?.status ?? "Gratuito";
  const endsAtLabel = sub?.endsAt ? new Date(sub.endsAt).toLocaleDateString("pt-BR") : null;
  const isPaid = sub?.rawStatus === "ACTIVE" || sub?.rawStatus === "TRIAL";

  const handleSaveName = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/me/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, name: data.user.name } : prev);
      setEditName(false);
      setProfileMsg({ type: "ok", text: "Nome atualizado com sucesso!" });
    } catch (err: unknown) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/me/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, companyCnpj, phone: companyPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, companyName: data.user.companyName, companyCnpj: data.user.companyCnpj, phone: data.user.phone } : prev);
      setEditCompany(false);
      setProfileMsg({ type: "ok", text: "Dados da empresa atualizados!" });
    } catch (err: unknown) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPassMsg({ type: "err", text: "As senhas não coincidem." }); return; }
    setSavingPass(true);
    setPassMsg(null);
    try {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPassMsg({ type: "ok", text: "Senha alterada com sucesso!" });
    } catch (err: unknown) {
      setPassMsg({ type: "err", text: err instanceof Error ? err.message : "Erro ao alterar senha." });
    } finally {
      setSavingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/me/delete", { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await signOut({ callbackUrl: "/" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir conta.");
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* App Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-100 flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-xl">☀️</div>
            <span className="text-xl font-extrabold text-[#1e3a5f]">SolarPro</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? "bg-yellow-50 text-yellow-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link href="/configuracoes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-yellow-50 text-yellow-700 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
            Configurações
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full mt-1 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
          <span className="font-bold text-[#1e3a5f]">Configurações</span>
          <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-white text-sm">{userInitial}</div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings sidebar */}
          <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-100 p-6 gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-3 pb-6 border-b border-gray-100 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {userInitial}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">{userName}</p>
                <p className="text-xs text-gray-500 mt-0.5 break-all">{userEmail}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{planLabel}</span>
              </div>
            </div>
            {settingsSections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id ? "bg-yellow-50 text-yellow-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                {s.label}
              </button>
            ))}
          </aside>

          {/* Tabs mobile */}
          <div className="lg:hidden flex overflow-x-auto border-b border-gray-100 bg-white px-4 gap-1 py-2 flex-shrink-0" style={{ minHeight: 52 }}>
            {settingsSections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSection === s.id ? "bg-yellow-400 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{settingsSections.find(s => s.id === activeSection)?.label}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeSection === "perfil" && "Gerencie as informações da sua conta."}
                {activeSection === "assinatura" && "Visualize e gerencie seu plano de assinatura."}
                {activeSection === "seguranca" && "Atualize sua senha e configure a segurança."}
                {activeSection === "perigo" && "Ações irreversíveis na sua conta."}
              </p>
            </div>

            {/* ── PERFIL ── */}
            {activeSection === "perfil" && (
              <div className="space-y-6 max-w-2xl">
                {profileMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${profileMsg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {profileMsg.text}
                  </div>
                )}

                {/* Avatar card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl font-bold text-white shadow-md flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg truncate">{userName}</h2>
                    <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">{planLabel}</p>
                  </div>
                </div>

                {/* Name */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nome completo</label>
                  {editName ? (
                    <div className="flex gap-3">
                      <input ref={nameInputRef} value={nameValue} onChange={e => setNameValue(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      <button onClick={handleSaveName} disabled={savingProfile} className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm disabled:opacity-60">{savingProfile ? "Salvando…" : "Salvar"}</button>
                      <button onClick={() => { setEditName(false); setNameValue(profile?.name ?? ""); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{userName}</span>
                      <button onClick={() => setEditName(true)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">Editar</button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">E-mail</label>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{userEmail}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.emailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {profile?.emailVerified ? "Verificado" : "Não verificado"}
                    </span>
                  </div>
                </div>

                {/* Company */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</label>
                    {!editCompany && <button onClick={() => setEditCompany(true)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">Editar</button>}
                  </div>
                  {editCompany ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Nome da empresa</label>
                        <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome da empresa" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">CNPJ</label>
                        <input value={companyCnpj} onChange={e => setCompanyCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Telefone</label>
                        <input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button onClick={handleSaveCompany} disabled={savingProfile} className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm disabled:opacity-60">{savingProfile ? "Salvando…" : "Salvar"}</button>
                        <button onClick={() => setEditCompany(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><p className="text-xs text-gray-400 mb-1">Nome da empresa</p><p className="text-sm text-gray-700 font-medium">{profile?.companyName || "—"}</p></div>
                      <div><p className="text-xs text-gray-400 mb-1">CNPJ</p><p className="text-sm text-gray-700 font-medium">{profile?.companyCnpj || "—"}</p></div>
                      <div><p className="text-xs text-gray-400 mb-1">Telefone</p><p className="text-sm text-gray-700 font-medium">{profile?.phone || "—"}</p></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ASSINATURA ── */}
            {activeSection === "assinatura" && (
              <div className="space-y-6 max-w-2xl">
                <div className={`bg-white rounded-2xl border shadow-sm p-6 ${isPaid ? "border-yellow-200" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Plano atual</p>
                      <h2 className="text-xl font-bold text-gray-900">{planLabel}</h2>
                      <p className="text-sm text-gray-500 mt-1">{statusLabel}</p>
                      {endsAtLabel && <p className="text-xs text-gray-400 mt-1">{sub?.rawStatus === "TRIAL" ? "Trial expira em" : "Renova em"}: {endsAtLabel}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{isPaid ? "Ativo" : "Gratuito"}</span>
                  </div>
                  {!isPaid && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-4">Faça upgrade para desbloquear todos os recursos do SolarPro.</p>
                      <Link href="/planos" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm transition-all">
                        Ver planos
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SEGURANÇA ── */}
            {activeSection === "seguranca" && (
              <div className="space-y-6 max-w-2xl">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Alterar senha</h3>
                  <p className="text-xs text-gray-400 mb-5">Escolha uma senha forte com pelo menos 8 caracteres.</p>
                  {profile?.provider === "google" ? (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">Esta conta usa login via Google. Para alterar a senha, acesse as configurações da sua conta Google.</p>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha atual</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Nova senha</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmar nova senha</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </div>
                      {passMsg && (
                        <p className={`text-sm rounded-xl px-4 py-2 ${passMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{passMsg.text}</p>
                      )}
                      <button type="submit" disabled={savingPass} className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-sm transition-all disabled:opacity-60">
                        {savingPass ? "Salvando…" : "Atualizar senha"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ── ZONA DE PERIGO ── */}
            {activeSection === "perigo" && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Excluir conta</h3>
                      <p className="text-sm text-gray-500 mb-4">Esta ação é permanente e irreversível. Todos os seus dados, propostas, clientes e cálculos serão excluídos.</p>
                      {!deleteConfirm ? (
                        <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                          Excluir minha conta
                        </button>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-red-700 mb-3">Tem certeza? Esta ação não pode ser desfeita.</p>
                          <div className="flex gap-3">
                            <button onClick={handleDeleteAccount} disabled={deletingAccount} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-60">
                              {deletingAccount ? "Excluindo…" : "Sim, excluir minha conta"}
                            </button>
                            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
