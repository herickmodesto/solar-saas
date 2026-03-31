"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ── Hero Register Form ─────────────────────────────────────────
function HeroRegisterForm({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [visible]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(data.redirectTo);
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [name, email, password, router]);

  if (!visible) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "28px 24px 20px",
        width: "100%",
        maxWidth: "340px",
        marginLeft: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0) scale(1)" : "translateX(48px) scale(0.95)",
        transition: "opacity 0.45s cubic-bezier(0.34,1.56,0.64,1), transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Botão fechar */}
      <button
        onClick={onClose}
        style={{ position: "absolute", top: "12px", right: "14px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af", lineHeight: 1 }}
      >✕</button>

      {/* Títulos */}
      <p style={{ fontSize: "20px", fontWeight: 700, color: "#000", margin: "0 0 4px" }}>Criar conta</p>
      <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 18px" }}>Comece com 7 dias grátis</p>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          required type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Nome"
          style={regInputStyle}
        />
        <input
          required type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
          style={regInputStyle}
        />
        <input
          required type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Senha"
          style={regInputStyle}
        />

        {error && (
          <p style={{ fontSize: "12px", color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "7px 10px", margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            height: "42px", borderRadius: "6px", border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#456882" : "#1B3C53", color: "#fff",
            fontWeight: 600, fontSize: "14px", transition: "background .2s", marginTop: "2px",
          }}
        >
          {loading ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      {/* Login link */}
      <p style={{ fontSize: "12px", color: "#374151", margin: "12px 0 14px", textAlign: "center" }}>
        Já tem uma conta?{" "}
        <Link href="/login" style={{ color: "#1B3C53", fontWeight: 600, cursor: "pointer" }}>
          Entrar
        </Link>
      </p>

      {/* Divisor */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Apple */}
        <button
          type="button"
          style={socialBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" style={{ width: "16px", height: "16px", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
            <path d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Registrar com Apple</span>
        </button>

        {/* Google */}
        <button
          type="button"
          onClick={() => { import("next-auth/react").then(m => m.signIn("google", { callbackUrl: "/dashboard" })); }}
          style={socialBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 48 48" style={{ width: "16px", height: "16px", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Registrar com Google</span>
        </button>
      </div>
    </div>
  );
}

const regInputStyle: React.CSSProperties = {
  height: "42px",
  padding: "0 14px",
  borderRadius: "6px",
  border: "1.5px solid #e5e7eb",
  fontSize: "13px",
  color: "#111827",
  outline: "none",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const socialBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "40px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
  width: "100%",
  transition: "background .15s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

function HeroScrollVideo({ showForm, setShowForm }: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.pause();

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const containerH = container.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / containerH));
      if (video.duration) {
        video.currentTime = progress * video.duration;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* 400vh = espaço de scroll que controla o vídeo */
    <div ref={containerRef} style={{ height: "200vh" }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#1B3C53]">

        {/* ── FUNDO: vídeo controlado pelo scroll ── */}
        <video
          ref={videoRef}
          src="/video/solar_scroll.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ── GRADIENTE leve para legibilidade do texto ── */}
        {/* Escurece apenas o centro/topo onde o texto fica, preservando os lados */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.2) 60%, transparent 100%)",
          }}
        />
        {/* Borda superior e inferior suaves */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B3C53]/40 via-transparent to-[#1B3C53]/50" />

        {/* ── CONTEÚDO: card glass à esquerda ── */}
        <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-16">
          <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">

            {/* ── Texto ── */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-yellow-300 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                ⚡ Plataforma #1 para integradoras solares
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5">
                Venda mais energia solar<br />
                <span className="text-yellow-400">com menos trabalho</span>
              </h1>
              <p className="text-sm sm:text-lg text-gray-200 max-w-xl leading-relaxed">
                Gere propostas e calcule aluguéis de usinas em segundos. Feito para integradoras e gestores de energia solar.
              </p>

            </div>

            {/* ── Formulário de cadastro (animado) ── */}
            <HeroRegisterForm visible={showForm} onClose={() => setShowForm(false)} />
          </div>
        </div>

      </div>
    </div>
  );
}

const features = [
  {
    icon: "📄",
    title: "Gerador de Propostas",
    desc: "Crie propostas comerciais profissionais em minutos com cálculos automáticos de economia, payback e geração de energia.",
  },
  {
    icon: "🔢",
    title: "Calculadora de Aluguel",
    desc: "Calcule com precisão o valor mensal do aluguel de usinas fotovoltaicas com base nas tarifas vigentes e regras do GD.",
  },
  {
    icon: "📊",
    title: "Relatórios Detalhados",
    desc: "Gere demonstrativos completos com comparativo de custos, gráficos de payback e análise financeira para 25 anos.",
  },
  {
    icon: "📱",
    title: "100% Online",
    desc: "Acesse de qualquer dispositivo, sem instalação. Seus dados salvos na nuvem e disponíveis quando precisar.",
  },
  {
    icon: "🖨️",
    title: "Exportação em PDF",
    desc: "Exporte propostas e relatórios em PDF profissional com a identidade visual da sua empresa, pronto para enviar ao cliente.",
  },
  {
    icon: "⚡",
    title: "Cálculos Automáticos",
    desc: "Fórmulas atualizadas automaticamente com tarifas ANEEL, tributos PIS/COFINS/ICMS e projeções de inflação energética.",
  },
];

const plans = [
  {
    name: "Proposta",
    price: "97",
    period: "/mês",
    highlight: false,
    description: "Perfeito para integradoras que precisam gerar propostas rápidas e profissionais.",
    features: [
      "Gerador de propostas ilimitadas",
      "Exportação em PDF",
      "Cálculo de payback automático",
      "Análise financeira 25 anos",
      "Relatório de produção anual",
      "Suporte via WhatsApp",
    ],
    cta: "Começar Grátis",
    ctaLink: "/proposta",
    trial: "7 dias grátis",
  },
  {
    name: "Pro",
    price: "197",
    period: "/mês",
    highlight: true,
    description: "A solução completa para empresas que trabalham com aluguel de usinas fotovoltaicas.",
    features: [
      "Tudo do plano Proposta",
      "Calculadora de aluguel de usinas",
      "Demonstrativo mensal de economia",
      "Análise mensal de vendas de energia",
      "Controle de múltiplos clientes",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    ctaLink: "/dashboard",
    trial: "7 dias grátis",
  },
  {
    name: "Enterprise",
    price: "497",
    period: "/mês",
    highlight: false,
    description: "Para empresas com múltiplas equipes e alto volume de clientes e usinas.",
    features: [
      "Tudo do plano Pro",
      "Usuários ilimitados",
      "Personalização de marca",
      "API de integração",
      "Onboarding dedicado",
      "SLA garantido",
    ],
    cta: "Falar com Vendas",
    ctaLink: "/dashboard",
    trial: "Demo gratuita",
  },
];

const faqs = [
  {
    q: "Preciso instalar algum software?",
    a: "Não. O SolarPro é 100% web. Basta acessar pelo navegador de qualquer computador, tablet ou celular.",
  },
  {
    q: "Os cálculos são atualizados com as tarifas da ANEEL?",
    a: "Sim. As tarifas de TE, TUSD e TUSD Fio B são configuráveis e você pode atualizar conforme as revisões tarifárias da ANEEL.",
  },
  {
    q: "Posso personalizar as propostas com minha marca?",
    a: "No plano Enterprise você pode adicionar logotipo, cores e informações da sua empresa nas propostas geradas.",
  },
  {
    q: "Como funciona o período de teste?",
    a: "Você tem 7 dias grátis para testar todas as funcionalidades do plano escolhido, sem precisar de cartão de crédito.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem fidelidade ou multa. Você pode cancelar sua assinatura a qualquer momento pelo painel.",
  },
];

// ── Payment Modal ─────────────────────────────────────────────
const payModalKeyframes = `
@keyframes pmSlideIn{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes pmCardSlide{0%{transform:translateY(0)}50%{transform:translateY(-70px) rotate(90deg)}60%{transform:translateY(-70px) rotate(90deg)}100%{transform:translateY(-8px) rotate(90deg)}}
@keyframes pmPostSlide{50%{transform:translateY(0)}100%{transform:translateY(-70px)}}
@keyframes pmDollarFade{0%{opacity:0;transform:translateY(-5px)}100%{opacity:1;transform:translateY(0)}}
@keyframes pmIconRotate{0%{opacity:0;visibility:hidden;transform:translateY(10px) scale(.5)}5%{opacity:1;visibility:visible;transform:translateY(0) scale(1)}15%{opacity:1;visibility:visible;transform:translateY(0) scale(1)}20%{opacity:0;visibility:hidden;transform:translateY(-10px) scale(.5)}100%{opacity:0;visibility:hidden;transform:translateY(-10px) scale(.5)}}
@keyframes pmCheck{0%{opacity:0;transform:scale(.5) rotate(-45deg)}50%{opacity:.5;transform:scale(1.2) rotate(0deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
`;

function PaymentModal({
  planName, planPrice, onClose,
}: { planName: string; planPrice: string; onClose: () => void }) {
  const [method, setMethod] = useState<"pix" | "credit">("pix");
  const [cpf, setCpf]     = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    const newTab = window.open("about:blank", "_blank", "noopener,noreferrer");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          method: method === "credit" ? "CREDIT" : "PIX",
          customerTaxId: cpf || undefined,
          customerCellphone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar pagamento.");
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        if (newTab) newTab.location.href = data.url;
        else window.location.href = data.url;
        onClose();
      }, 2200);
    } catch (err: unknown) {
      newTab?.close();
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
      setPaying(false);
    }
  };

  const inp: React.CSSProperties = {
    height: "40px", padding: "0 14px", borderRadius: "9px",
    border: "1px solid #D2C1B6", fontSize: "13px", color: "#111",
    outline: "none", background: "#F9F3EF", width: "100%", boxSizing: "border-box",
  };

  return (
    <>
      <style>{payModalKeyframes}</style>
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        }}
      >
        <div style={{
          background: "#fff", borderRadius: "26px", width: "100%", maxWidth: "440px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          animation: "pmSlideIn .3s ease both",
        }}>
          {success ? (
            /* ── Success ── */
            <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              {/* New-transaction card animation */}
              <div style={{
                background: "#fff", display: "flex", width: "340px", height: "120px",
                borderRadius: "6px", boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}>
                {/* Left green side */}
                <div style={{
                  background: "#5de2a3", width: "100%", height: "120px", borderRadius: "4px",
                  position: "relative", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden",
                }}>
                  {/* Card */}
                  <div style={{
                    width: "70px", height: "46px", background: "#c7ffbc", borderRadius: "6px",
                    position: "absolute", zIndex: 10, display: "flex", flexDirection: "column",
                    alignItems: "center", boxShadow: "9px 9px 9px -2px rgba(77,200,143,0.72)",
                    animation: "pmCardSlide 1.2s cubic-bezier(.645,.045,.355,1) both",
                  }}>
                    <div style={{ width: "65px", height: "13px", background: "#80ea69", borderRadius: "2px", marginTop: "7px" }} />
                    <div style={{
                      width: "8px", height: "8px", background: "#379e1f", borderRadius: "50%",
                      marginTop: "10px", marginLeft: "-30px",
                      boxShadow: "0 -10px 0 0 #26850e, 0 10px 0 0 #56be3e", transform: "rotate(90deg)",
                    }} />
                  </div>
                  {/* POS terminal */}
                  <div style={{
                    width: "63px", height: "75px", background: "#dddde0", position: "absolute",
                    zIndex: 11, bottom: "10px", top: "120px", borderRadius: "6px", overflow: "hidden",
                    animation: "pmPostSlide 1s cubic-bezier(.165,.84,.44,1) both",
                  }}>
                    <div style={{ width: "47px", height: "9px", background: "#545354", position: "absolute", borderRadius: "0 0 3px 3px", right: "8px", top: "8px" }} />
                    <div style={{ width: "47px", height: "23px", background: "#fff", position: "absolute", top: "22px", right: "8px", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#4b953b", animation: "pmDollarFade .3s .9s backwards" }}>R$</span>
                    </div>
                    <div style={{ width: "12px", height: "12px", background: "#838183", borderRadius: "2px", position: "absolute", transform: "rotate(90deg)", left: "25px", top: "52px", boxShadow: "0 -18px 0 0 #838183, 0 18px 0 0 #838183" }} />
                    <div style={{ width: "12px", height: "12px", background: "#aaa9ab", borderRadius: "2px", position: "absolute", transform: "rotate(90deg)", left: "25px", top: "68px", boxShadow: "0 -18px 0 0 #aaa9ab, 0 18px 0 0 #aaa9ab" }} />
                  </div>
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: "18px", color: "#1B3C53", margin: 0 }}>Pagamento iniciado!</p>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, textAlign: "center" }}>
                Uma nova aba foi aberta com sua página de pagamento seguro.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "#1B3C53", margin: 0 }}>Assinar Plano {planName}</p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "3px 0 0" }}>R$ {planPrice}/mês · 7 dias grátis</p>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af", lineHeight: 1, padding: "2px 4px" }}>✕</button>
              </div>

              {/* Method selector */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#8b8e98", marginBottom: "10px" }}>Método de pagamento</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { id: "pix", label: "PIX", icon: (
                      <svg width="28" height="28" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H118.4C138.4 391.2 157.3 383.4 171.5 369.2L242.4 292.5zM262.5 219.5C257.1 224.9 247.8 224.9 242.4 219.5L171.5 142.8C157.3 128.6 138.4 120.8 118.4 120.8H103.3L200.7 23.4C231 -6.9 280.2 -6.9 310.5 23.4L407.6 120.5H392.5C372.5 120.5 353.6 128.3 339.4 142.5L262.5 219.5zM112.7 143.5H118.4C131.9 143.5 144.8 148.9 154.3 158.4L225.2 235.1C236.8 246.7 255.2 246.7 266.8 235.1L337.7 158.4C347.2 148.9 360.1 143.5 373.6 143.5H405.8L488.6 200.8C518.9 231.1 518.9 280.3 488.6 310.6L405.8 368H373.6C360.1 368 347.2 362.6 337.7 353.1L266.8 276.4C255.2 264.8 236.8 264.8 225.2 276.4L154.3 353.1C144.8 362.6 131.9 368 118.4 368H112.7L23.4 310.6C-6.9 280.3 -6.9 231.1 23.4 200.8L112.7 143.5z"/>
                      </svg>
                    )},
                    { id: "credit", label: "Cartão de crédito", icon: (
                      <svg width="28" height="28" viewBox="0 0 576 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M512 32c35.3 0 64 28.7 64 64v32H0V96C0 60.7 28.7 32 64 32H512zM0 192H576V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V192zm160 96c-17.7 0-32 14.3-32 32s14.3 32 32 32H288c17.7 0 32-14.3 32-32s-14.3-32-32-32H160zm128 0c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H288z"/>
                      </svg>
                    )},
                  ].map(({ id, label, icon }) => (
                    <label
                      key={id}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderRadius: "10px", padding: "10px 14px",
                        border: method === id ? `1.5px solid #1B3C53` : "1.5px solid #D2C1B6",
                        background: method === id ? "#F9F3EF" : "#f2f2f2",
                        color: method === id ? "#1B3C53" : "#374151",
                        fontWeight: method === id ? 600 : 400,
                        cursor: "pointer", transition: "all .25s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {icon}
                        <span style={{ fontSize: "14px" }}>{label}</span>
                      </div>
                      <input
                        type="radio" name="pm-method" value={id}
                        checked={method === id}
                        onChange={() => setMethod(id as "pix" | "credit")}
                        style={{ accentColor: "#1B3C53" }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#8b8e98", margin: 0 }}>Dados do pagador <span style={{ fontWeight: 400 }}>(opcional)</span></p>
                <input placeholder="CPF / CNPJ" value={cpf} onChange={e => setCpf(e.target.value)} style={inp} />
                <input placeholder="Telefone (ex: 11999999999)" value={phone} onChange={e => setPhone(e.target.value)} style={inp} />
              </div>

              {error && (
                <p style={{ fontSize: "12px", color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 12px", margin: 0 }}>
                  {error}
                </p>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  height: "52px", borderRadius: "10px", border: "none",
                  cursor: paying ? "not-allowed" : "pointer",
                  color: "#fff", fontSize: "15px", fontWeight: 700,
                  background: "linear-gradient(180deg,#363636 0%,#1b1b1b 50%,#000 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  opacity: paying ? 0.75 : 1,
                  transition: "opacity .2s, box-shadow .3s",
                  boxShadow: paying ? "none" : "0 0 0 0 #fff",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { if (!paying) e.currentTarget.style.boxShadow = "0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span>Pagar Agora</span>
                    <div style={{ position: "relative", width: "22px", height: "22px" }}>
                      {[
                        { d: "M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z", delay: "0s" },
                        { d: "M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z", delay: "0.5s" },
                        { d: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", delay: "1s" },
                      ].map(({ d, delay }, i) => (
                        <svg key={i} viewBox="0 0 24 24" style={{ position: "absolute", top: 0, left: 0, width: "22px", height: "22px", color: "#22c55e", animation: `pmIconRotate 2.5s ${delay} infinite`, opacity: 0, visibility: "hidden" }} fill="currentColor">
                          <path d={d} />
                        </svg>
                      ))}
                      <svg viewBox="0 0 24 24" style={{ position: "absolute", top: 0, left: 0, width: "22px", height: "22px", color: "#22c55e" }} fill="currentColor">
                        <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" />
                      </svg>
                    </div>
                  </>
                )}
              </button>

              <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", margin: 0 }}>
                🔒 Pagamento seguro via Abacatepay
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Landing Page ───────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const openRegister = () => {
    setShowForm(true);
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePlanCheckout = (planName: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/");
      return;
    }
    const plan = plans.find(p => p.name === planName);
    setSelectedPlan({ name: planName, price: plan?.price ?? "" });
  };

  return (
    <div className="min-h-screen bg-white">
      {selectedPlan && (
        <PaymentModal
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {/* Mobile drawer overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
      />

      {/* Mobile drawer */}
      <aside
        className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col md:hidden"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
            <span className="text-lg font-bold text-[#1B3C53]">SolarPro</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-6 flex-1">
          {[
            { label: "Funcionalidades", href: "#funcionalidades" },
            { label: "Planos", href: "#planos" },
            { label: "FAQ", href: "#faq" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-[#1B3C53] transition-colors"
              style={{ background: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F9F3EF")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-4 pb-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block text-center py-3 rounded-xl border border-[#1B3C53] text-[#1B3C53] text-sm font-semibold transition-colors" style={{ background: "none" }} onMouseEnter={e => (e.currentTarget.style.background="#F9F3EF")} onMouseLeave={e => (e.currentTarget.style.background="none")}
          >
            Entrar
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block text-center py-3 rounded-xl bg-[#1B3C53] text-white text-sm font-bold hover:bg-[#456882] transition-colors"
          >
            🚀 Ir para o Dashboard
          </Link>
        </div>
      </aside>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
            <span className="text-xl font-bold text-[#1B3C53]">SolarPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-[#1B3C53] transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-[#1B3C53] transition-colors">Planos</a>
            <a href="#faq" className="hover:text-[#1B3C53] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden md:block text-sm font-medium text-gray-600 hover:text-[#1B3C53] transition-colors px-3 py-2">
              Entrar
            </Link>
            <button
              onClick={openRegister}
              className="hidden md:relative md:flex items-center px-5 py-2 overflow-hidden font-semibold text-sm transition-all bg-[#1B3C53] rounded-lg group"
            >
              <span className="absolute top-0 right-0 inline-block w-4 h-4 transition-all duration-500 ease-in-out bg-[#132e42] rounded group-hover:-mr-4 group-hover:-mt-4">
                <span className="absolute top-0 right-0 w-5 h-5 rotate-45 translate-x-1/2 -translate-y-1/2 bg-white" />
              </span>
              <span className="absolute bottom-0 rotate-180 left-0 inline-block w-4 h-4 transition-all duration-500 ease-in-out bg-[#132e42] rounded group-hover:-ml-4 group-hover:-mb-4">
                <span className="absolute top-0 right-0 w-5 h-5 rotate-45 translate-x-1/2 -translate-y-1/2 bg-white" />
              </span>
              <span className="absolute bottom-0 left-0 w-full h-full transition-all duration-500 ease-in-out delay-200 -translate-x-full bg-[#456882] rounded-lg group-hover:translate-x-0" />
              <span className="relative text-white transition-colors duration-200 ease-in-out group-hover:text-white">
                Começar Grátis
              </span>
            </button>

          </div>
        </div>
      </nav>

      {/* Hero — vídeo como fundo, texto em cima */}
      <div ref={heroRef}>
        <HeroScrollVideo showForm={showForm} setShowForm={setShowForm} />
      </div>

      {/* Stats */}
      <section className="bg-[#1B3C53] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { v: "500+", l: "Propostas geradas" },
            { v: "R$2M+", l: "Em negócios fechados" },
            { v: "98%", l: "Satisfação dos clientes" },
            { v: "5min", l: "Para gerar uma proposta" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl font-extrabold text-yellow-400">{s.v}</div>
              <div className="text-sm text-blue-200 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Solid-style */}
      <section id="funcionalidades" className="py-20 lg:py-28" style={{ background: "#F9F3EF" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-8 xl:px-0">

          {/* ── Section header ── */}
          <div className="mx-auto mb-14 text-center">
            {/* Badge */}
            <span
              className="mb-4 inline-block rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "#EDF5FF", color: "#1B3C53", letterSpacing: "0.12em" }}
            >
              Funcionalidades
            </span>

            <h2
              className="mx-auto mb-4 text-3xl font-bold md:text-4xl"
              style={{ color: "#1B3C53", maxWidth: "600px", lineHeight: "1.2" }}
            >
              Tudo que você precisa para vender energia solar
            </h2>

            <p
              className="mx-auto text-sm leading-relaxed"
              style={{ color: "#757693", maxWidth: "520px" }}
            >
              Ferramentas pensadas para integradoras, gestores de usinas e consultores
              de energia fotovoltaica.
            </p>
          </div>

          {/* ── Cards grid ── */}
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-feature rounded-lg bg-white p-8 shadow-solid-3 transition-all hover:shadow-solid-4 hover:-translate-y-1 xl:p-10"
                style={{
                  border: "1px solid #fff",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {/* Icon box — Solid style: coloured square bg */}
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-md text-2xl mb-7"
                  style={{ background: "#1B3C53" }}
                >
                  <span role="img" aria-label={f.title}>{f.icon}</span>
                </div>

                <h3
                  className="mb-4 text-lg font-semibold xl:text-xl"
                  style={{ color: "#1B3C53" }}
                >
                  {f.title}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: "#757693" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-yellow-500 font-semibold text-sm uppercase tracking-wide">Ferramenta 1</span>
              <h2 className="text-3xl font-extrabold text-[#1B3C53] mt-2 mb-4">
                Gerador de Propostas Comerciais
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Preencha os dados do cliente, do sistema fotovoltaico e da análise financeira. Em segundos, gere uma proposta profissional em PDF pronta para enviar.
              </p>
              <ul className="space-y-3 mb-8">
                {["Cálculo automático de payback", "Geração estimada mensal e anual", "Comparativo de investimento (Solar vs CDI vs Poupança)", "Análise de economia em 25 anos", "Impacto ambiental (CO₂, árvores, km)"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/proposta" className="inline-block bg-[#1B3C53] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#456882] transition-colors">
                Criar Proposta →
              </Link>
            </div>
            <div className="bg-gradient-to-br from-[#1B3C53] to-[#456882] rounded-2xl p-6 text-white shadow-xl">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="text-xs text-blue-200 mb-1">Cliente</div>
                <div className="font-semibold">Francisco Caninde da Cunha</div>
                <div className="text-sm text-blue-200">Natal, Rio Grande do Norte</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-xs text-blue-200 mb-1">Potência</div>
                  <div className="text-2xl font-bold text-yellow-400">89,60 kWp</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-xs text-blue-200 mb-1">Módulos</div>
                  <div className="text-2xl font-bold text-yellow-400">128</div>
                </div>
              </div>
              <div className="bg-yellow-400 text-[#1B3C53] rounded-xl p-4">
                <div className="text-xs font-semibold mb-1">Economia em 25 anos</div>
                <div className="text-2xl font-extrabold">R$ 5.920.507,40</div>
                <div className="text-xs mt-1">Payback: 1 ano e 10 meses</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mt-24">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl order-2 md:order-1">
              <div className="text-sm text-gray-400 mb-4 font-semibold">DEMONSTRATIVO DE ECONOMIA</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg">
                  <span className="text-sm">Custo sem Usina</span>
                  <span className="font-bold text-red-400">R$ 14.930,99</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                  <span className="text-sm">Custo com Usina</span>
                  <span className="font-bold text-green-400">R$ 13.895,45</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-400/20 rounded-lg">
                  <span className="text-sm font-semibold">Valor do Aluguel</span>
                  <span className="font-bold text-yellow-400">R$ 11.534,19</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
                <div><div className="text-green-400 font-bold">26,97</div>CO₂ evitado</div>
                <div><div className="text-green-400 font-bold">163</div>Árvores salvas</div>
                <div><div className="text-green-400 font-bold">44.959</div>kWh limpa</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-yellow-500 font-semibold text-sm uppercase tracking-wide">Ferramenta 2</span>
              <h2 className="text-3xl font-extrabold text-[#1B3C53] mt-2 mb-4">
                Calculadora de Aluguel de Usinas
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Insira os dados de consumo e compensação do cliente para calcular automaticamente o valor mensal do aluguel da usina fotovoltaica, com base nas tarifas e tributações vigentes.
              </p>
              <ul className="space-y-3 mb-8">
                {["Cálculo com TE, TUSD e Fio B", "Tributação PIS/COFINS/ICMS automática", "Escalonamento de taxação por ano (2024–2028)", "Comparativo custos sem vs. com usina", "Demonstrativo de emissões evitadas"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/calculadora" className="inline-block bg-[#1B3C53] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#456882] transition-colors">
                Calcular Aluguel →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20" style={{ background: "#F9F3EF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1B3C53] mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-gray-500">Escolha o plano ideal para o seu negócio. Sem taxa de setup.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${plan.highlight
                  ? "bg-[#1B3C53] text-white shadow-2xl scale-105 border-2 border-yellow-400"
                  : "bg-white text-gray-800 shadow-sm"
                  }`}
                style={!plan.highlight ? { border: "1px solid #D2C1B6" } : undefined}
              >
                {plan.highlight && (
                  <div className="inline-block bg-yellow-400 text-[#1B3C53] text-xs font-bold px-3 py-1 rounded-full mb-4">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-[#1B3C53]"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-[#D2C1B6]" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-sm ${plan.highlight ? "text-[#D2C1B6]" : "text-gray-400"}`}>R$</span>
                  <span className={`text-5xl font-extrabold ${plan.highlight ? "text-yellow-400" : "text-[#1B3C53]"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm mb-2 ${plan.highlight ? "text-[#D2C1B6]" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-xs mb-6 ${plan.highlight ? "text-yellow-300" : "text-green-600"}`}>
                  ✓ {plan.trial}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-3 text-sm ${plan.highlight ? "text-[#F9F3EF]" : "text-gray-600"}`}>
                      <span className={plan.highlight ? "text-yellow-400" : "text-green-500"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.name === "Enterprise" ? openRegister() : handlePlanCheckout(plan.name)}
                  className={`w-full text-center font-bold py-3 rounded-xl transition-colors ${plan.highlight
                    ? "bg-yellow-400 text-[#1B3C53] hover:bg-yellow-300"
                    : "bg-[#1B3C53] text-white hover:bg-[#456882]"
                    }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#1B3C53] mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-500">Tudo que você precisa saber antes de começar.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid #D2C1B6" }}>
                <button
                  className="w-full flex justify-between items-center p-5 text-left font-semibold text-[#1B3C53] transition-colors"
                  style={{ background: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9F3EF")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className="text-xl text-gray-400">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed" style={{ borderTop: "1px solid #D2C1B6" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-[#1B3C53] to-[#456882] py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-4xl mb-4">☀️</div>
          <h2 className="text-3xl font-extrabold mb-4">Pronto para vender mais energia solar?</h2>
          <p className="text-blue-200 mb-8">Comece hoje e gere sua primeira proposta em menos de 5 minutos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/proposta" className="bg-yellow-400 text-[#1B3C53] font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300 transition-colors">
              Criar Proposta Grátis
            </Link>
            <Link href="/calculadora" className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/20 transition-colors">
              Calcular Aluguel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10" style={{ background: "#1B3C53", color: "#D2C1B6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center text-sm">☀️</div>
            <span className="font-bold text-white">SolarPro</span>
            <span className="text-sm">© 2025</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/proposta" className="hover:text-white transition-colors">Proposta</Link>
            <Link href="/calculadora" className="hover:text-white transition-colors">Calculadora</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
