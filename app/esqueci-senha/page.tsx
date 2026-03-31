"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar e-mail.");
      // Se o e-mail não existir, a API retorna ok:true mas sem userId (para não revelar se o e-mail existe)
      // Nesse caso mostramos mensagem genérica sem redirecionar
      if (!data.userId) {
        setError("Se este e-mail estiver cadastrado, você receberá um código em breve.");
        return;
      }
      router.push(
        `/redefinir-senha?userId=${data.userId}&email=${encodeURIComponent(data.email)}`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2a5298] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-2xl">☀️</div>
            <span className="text-2xl font-extrabold text-white">SolarPro</span>
          </Link>
        </div>

        <div
          className="bg-white rounded-[10px] p-8 flex flex-col gap-5"
          style={{ boxShadow: "0px 0px 3px rgba(0,0,0,0.084), 0px 2px 3px rgba(0,0,0,0.168)" }}
        >
          <p className="text-center font-semibold text-lg text-[#212121]">Esqueceu a senha?</p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-[#212121]">E-mail</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="w-full px-4 py-3 rounded-[6px] border border-[#ccc] text-sm outline-none transition-all focus:border-[#1e3a5f] placeholder:opacity-50"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[6px] bg-[#212121] text-white text-sm font-medium hover:bg-[#313131] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ boxShadow: "0px 0px 3px rgba(0,0,0,0.084), 0px 2px 3px rgba(0,0,0,0.168)" }}
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-[#212121]">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-[#1778f2] hover:underline font-normal">
              Fazer login
            </Link>
          </p>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2025 SolarPro • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
