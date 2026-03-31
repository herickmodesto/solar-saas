"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const PLANS = [
  {
    key: "free",
    name: "Free Plan",
    price: 0,
    priceLabel: "Grátis",
    description: "Para começar a explorar o SolarPro.",
    features: [
      "5 propostas por mês",
      "Calculadora GD básica",
      "1 usuário",
      "Suporte por e-mail",
    ],
    cta: "Plano atual",
    highlight: false,
    disabled: true,
  },
  {
    key: "Proposta",
    name: "Plano Proposta",
    price: 97,
    priceLabel: "R$97",
    description: "Para integradores que precisam de produtividade.",
    features: [
      "Propostas ilimitadas",
      "Calculadora GD completa",
      "Análise mensal",
      "Upload de faturas",
      "Exportar PDF",
      "Suporte prioritário",
    ],
    cta: "Assinar agora",
    highlight: true,
    disabled: false,
  },
  {
    key: "Pro",
    name: "Plano Pro",
    price: 197,
    priceLabel: "R$197",
    description: "Para empresas com alto volume de operações.",
    features: [
      "Tudo do Plano Proposta",
      "Multi-usuários (até 5)",
      "Relatórios avançados",
      "API access",
      "Integração com CRM",
      "Gerente de conta dedicado",
    ],
    cta: "Assinar agora",
    highlight: false,
    disabled: false,
  },
];

const PAYMENT_METHODS = [
  {
    icon: (
      <svg viewBox="0 0 512 512" fill="currentColor" className="w-8 h-8 text-[#1B6B4A]">
        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.8 224.5 242.4 218.9L165.7 142.2C151.5 127.1 132.6 120.2 112.6 120.2H103.3L200.7 22.8C231.1-7.6 280.3-7.6 310.6 22.8L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 148.5 157.7L246.6 255.9L148.5 354.2C139.1 363.6 126.4 369.2 112.6 369.2H48.2L48.2 142.7L112.6 142.7zM399.3 142.7C413.1 142.7 425.8 148.3 435.2 157.7L511.6 234.1C513 235.6 513 237.9 511.6 239.4L435.2 315.8C425.8 325.2 413.1 330.8 399.3 330.8L320 330.8L418.1 232.6C427.5 223.2 427.5 207.9 418.1 198.5L320 100.2H399.3V142.7z"/>
      </svg>
    ),
    title: "Pagamentos via Pix",
    description: "Permite transferências instantâneas e seguras via Pix, integradas ao seu sistema em tempo real.",
  },
  {
    icon: (
      <svg viewBox="0 0 576 512" fill="currentColor" className="w-8 h-8 text-[#1B6B4A]">
        <path d="M512 80c8.8 0 16 7.2 16 16v32H48V96c0-8.8 7.2-16 16-16H512zm16 144V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224H528zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm56 304c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24H296c13.3 0 24-10.7 24-24s-10.7-24-24-24H248z"/>
      </svg>
    ),
    title: "Cartão de Crédito",
    description: "Aceitamos os pagamentos com cartão de crédito com alta taxa de aprovação.",
  },
  {
    icon: (
      <svg viewBox="0 0 384 512" fill="currentColor" className="w-8 h-8 text-[#1B6B4A]">
        <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM80 224H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
      </svg>
    ),
    title: "Boleto",
    description: "A AbacatePay gera boletos de forma prática e rastreável, facilitando a cobrança e a reconciliação financeira.",
  },
  {
    icon: (
      <svg viewBox="0 0 640 512" fill="currentColor" className="w-8 h-8 text-[#1B6B4A]">
        <path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372.7 74 321.7 105.5 290.2L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.8l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/>
      </svg>
    ),
    title: "Link e QR Codes",
    description: "Também é possível criar links e QR Codes de pagamento personalizados, ideais para vendas rápidas e remotas.",
  },
];

export default function PlanosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planKey: string, planPrice: number) => {
    if (!session) {
      router.push("/login?callbackUrl=/planos");
      return;
    }
    setLoading(planKey);
    setError(null);

    // Abre a guia imediatamente em resposta ao clique (antes do fetch)
    // para não ser bloqueado pelo popup-blocker do browser.
    // noopener: impede que a nova guia acesse window.opener (previne tabnapping)
    // noreferrer: não envia o Referer header (privacidade da URL de origem)
    const newTab = window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao iniciar pagamento.");

      if (newTab) {
        // Navega a nova guia para o checkout e garante que o opener está nulo
        newTab.location.href = data.url;
      } else {
        // Fallback: se o popup foi bloqueado, redireciona na mesma guia
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      // Fecha a guia vazia se houve erro
      newTab?.close();
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-xl">☀️</div>
          <span className="text-xl font-extrabold text-[#1e3a5f]">SolarPro</span>
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
              Ir para o Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">Entrar</Link>
              <Link href="/login" className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold transition-all">Criar conta</Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-[#1e3a5f] mb-4">Escolha seu plano</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar. Sem contratos, cancele quando quiser.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col p-6 relative transition-all ${
                plan.highlight
                  ? "border-yellow-400 shadow-yellow-100 shadow-md ring-2 ring-yellow-400/30"
                  : "border-gray-100"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Mais popular
                  </span>
                </div>
              )}
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h2>
                <p className="text-xs text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#1e3a5f]">{plan.priceLabel}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-400">/mês</span>}
                </div>
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled || loading === plan.key}
                onClick={() => !plan.disabled && handleCheckout(plan.key, plan.price)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  plan.disabled
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : plan.highlight
                    ? "bg-yellow-400 hover:bg-yellow-500 text-white shadow-sm"
                    : "bg-[#1e3a5f] hover:bg-[#2a4f80] text-white"
                } disabled:opacity-70`}
              >
                {loading === plan.key ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Aguarde...
                  </span>
                ) : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Métodos de pagamento aceitos</h2>
            <p className="text-sm text-gray-400">Processado com segurança pela AbacatePay</p>
          </div>

          {/* Top bar gradient */}
          <div className="h-1 bg-gradient-to-r from-[#1B6B4A] to-[#4CAF50] rounded-full mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {PAYMENT_METHODS.map((method, i) => (
              <div key={i} className="flex flex-col gap-4 px-6 py-6 first:pl-0 last:pr-0">
                <div className="w-12 h-12 border-l-4 border-[#4CAF50] flex items-center justify-center pl-3">
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ / Trust */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: "🔒", title: "Pagamento seguro", desc: "Seus dados são protegidos com criptografia SSL." },
            { icon: "🚫", title: "Cancele quando quiser", desc: "Sem fidelidade. Cancele a assinatura a qualquer momento." },
            { icon: "💬", title: "Suporte humano", desc: "Atendimento real para te ajudar em cada etapa." },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
