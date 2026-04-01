"use client";
import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [values, setValues] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown para reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-foca primeiro input
  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...values];
      next[index] = digit;
      setValues(next);
      setError(null);
      if (digit && index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    },
    [values]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !values[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    },
    [values]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (!pasted) return;
      e.preventDefault();
      const next = [...values];
      pasted.split("").forEach((d, i) => { next[i] = d; });
      setValues(next);
      inputRefs[Math.min(pasted.length, 3)].current?.focus();
    },
    [values]
  );

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = values.join("");
    if (code.length < 4) { setError("Preencha todos os 4 dígitos."); triggerShake(); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Código inválido.");
        triggerShake();
        setValues(["", "", "", ""]);
        inputRefs[0].current?.focus();
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login?verified=1"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResendCooldown(60);
      setValues(["", "", "", ""]);
      inputRefs[0].current?.focus();
    } catch {
      setError("Erro ao reenviar. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1e3a5f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top bar */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a5298] px-8 py-6 text-center">
            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
              ☀️
            </div>
            <h1 className="text-white font-bold text-xl">SolarPro</h1>
          </div>

          {/* Form area */}
          <div className="px-8 py-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  ✅
                </div>
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">E-mail verificado!</h2>
                <p className="text-gray-500 text-sm">Redirecionando para o login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-1">
                  Digite o código
                </h2>
                <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                  Enviamos um código de 4 dígitos para<br />
                  <strong className="text-[#1e3a5f]">{email || "seu e-mail"}</strong>
                </p>

                {/* OTP Inputs */}
                <div
                  className="flex gap-3 justify-center mb-6"
                  style={shake ? { animation: "shake 0.4s ease" } : {}}
                >
                  {values.map((val, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={`
                        w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none
                        transition-all duration-200 bg-gray-50
                        ${val ? "border-[#1e3a5f] bg-[#f0f7ff] text-[#1e3a5f] scale-105" : "border-gray-200 text-gray-800"}
                        ${error ? "border-red-400 bg-red-50" : ""}
                        focus:border-[#1e3a5f] focus:bg-white focus:scale-105
                      `}
                    />
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <p className="text-center text-sm text-red-500 mb-4 bg-red-50 rounded-xl py-2 px-3">
                    {error}
                  </p>
                )}

                {/* Verify button */}
                <button
                  type="submit"
                  disabled={loading || values.join("").length < 4}
                  className="w-full h-12 rounded-2xl bg-[#1e3a5f] text-white font-bold text-sm
                    transition-all hover:bg-[#2a4f80] disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.98]"
                >
                  {loading ? "Verificando..." : "Verificar"}
                </button>

                {/* Resend */}
                <p className="text-center text-sm text-gray-400 mt-5">
                  Não recebeu o código?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-[#1e3a5f] font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
                  </button>
                </p>

                {/* Back */}
                <div className="mt-6 text-center">
                  <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
