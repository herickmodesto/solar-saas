"use client";
import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const email = searchParams.get("email") ?? "";

  const [step, setStep] = useState<"otp" | "password">("otp");
  const [values, setValues] = useState(["", "", "", ""]);
  const [verifiedCode, setVerifiedCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPass, setShowPass] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);
    setError(null);
    if (digit && index < 3) inputRefs[index + 1].current?.focus();
  }, [values]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) inputRefs[index - 1].current?.focus();
  }, [values]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    const next = [...values];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setValues(next);
    inputRefs[Math.min(pasted.length, 3)].current?.focus();
  }, [values]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = values.join("");
    if (code.length < 4) { setError("Preencha todos os 4 dígitos."); triggerShake(); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Código inválido."); triggerShake(); return; }
      setVerifiedCode(code);
      setStep("password");
    } catch {
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: verifiedCode, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao redefinir senha.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1e3a5f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a5298] px-8 py-6 text-center">
            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">☀️</div>
            <h1 className="text-white font-bold text-xl">SolarPro</h1>
          </div>

          <div className="px-8 py-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Senha redefinida!</h2>
                <p className="text-gray-500 text-sm">Redirecionando para o login...</p>
              </div>
            ) : step === "otp" ? (
              <form onSubmit={handleVerifyCode}>
                <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-1">Verifique seu e-mail</h2>
                <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                  Enviamos um código de 4 dígitos para<br />
                  <strong className="text-[#1e3a5f]">{email || "seu e-mail"}</strong>
                </p>

                <div className="flex gap-3 justify-center mb-6" style={shake ? { animation: "shake 0.4s ease" } : {}}>
                  {values.map((val, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all duration-200 bg-gray-50
                        ${val ? "border-[#1e3a5f] bg-[#f0f7ff] text-[#1e3a5f] scale-105" : "border-gray-200 text-gray-800"}
                        ${error ? "border-red-400 bg-red-50" : ""}
                        focus:border-[#1e3a5f] focus:bg-white focus:scale-105`}
                    />
                  ))}
                </div>

                {error && <p className="text-center text-sm text-red-500 mb-4 bg-red-50 rounded-xl py-2 px-3">{error}</p>}

                <button
                  type="submit"
                  disabled={values.join("").length < 4 || loading}
                  className="w-full h-12 rounded-2xl bg-[#1e3a5f] text-white font-bold text-sm transition-all hover:bg-[#2a4f80] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? "Verificando..." : "Continuar"}
                </button>

                <p className="text-center text-sm text-gray-400 mt-5">
                  Não recebeu?{" "}
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                    className="text-[#1e3a5f] font-semibold hover:underline disabled:text-gray-400">
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
                  </button>
                </p>
                <div className="mt-6 text-center">
                  <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">← Voltar para o login</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-1">Nova senha</h2>
                <p className="text-sm text-gray-500 text-center mb-8">Escolha uma senha com pelo menos 8 caracteres.</p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-1">Nova senha</label>
                    <div className="border border-[#ecedec] rounded-xl h-12 flex items-center px-3 gap-2 focus-within:border-[#1e3a5f] transition-colors">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="flex-1 h-full text-sm border-none outline-none bg-transparent"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                        {showPass ? (
                          <svg viewBox="0 0 576 512" height="16" fill="currentColor"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-1">Confirmar senha</label>
                    <div className="border border-[#ecedec] rounded-xl h-12 flex items-center px-3 gap-2 focus-within:border-[#1e3a5f] transition-colors">
                      <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="flex-1 h-full text-sm border-none outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center mt-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full h-12 rounded-2xl bg-[#1e3a5f] text-white font-bold text-sm transition-all hover:bg-[#2a4f80] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>

                <div className="mt-4 text-center">
                  <button type="button" onClick={() => setStep("otp")} className="text-xs text-gray-400 hover:text-gray-600">
                    ← Voltar
                  </button>
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

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
