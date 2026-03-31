"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const verified = searchParams.get("verified");

  const [tab, setTab] = useState<"login" | "register">("login");

  // ── Login state
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password: senha,
        redirect: false,
      });
      if (result?.error) {
        setLoginError("E-mail ou senha incorretos.");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setLoginError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rPassword.length < 8) { setRegisterError("A senha deve ter no mínimo 8 caracteres."); return; }
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rName, email: rEmail, password: rPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setRegisterError(data.error); return; }
      router.push(data.redirectTo);
    } catch {
      setRegisterError("Erro ao criar conta. Tente novamente.");
    } finally {
      setRegisterLoading(false);
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
          <p className="text-blue-200 text-sm mt-2">
            {tab === "login" ? "Acesse sua conta" : "Crie sua conta grátis"}
          </p>
        </div>

        {verified && (
          <div className="mb-4 bg-green-500/20 border border-green-400/30 text-green-300 text-sm rounded-xl px-4 py-3 text-center">
            ✅ E-mail verificado! Faça login para continuar.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === "login" ? "text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === "register" ? "text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              Criar conta
            </button>
          </div>

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="p-8 flex flex-col gap-4">
              <div>
                <label className="block font-semibold text-[#151717] mb-1 text-sm">E-mail</label>
                <div className="border border-[#ecedec] rounded-xl h-12 flex items-center px-3 gap-2 focus-within:border-[#1e3a5f] transition-colors">
                  <svg height="20" viewBox="0 0 32 32" width="20" className="text-gray-400 flex-shrink-0">
                    <g><path fill="currentColor" d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" /></g>
                  </svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" className="flex-1 h-full text-sm border-none outline-none bg-transparent" required />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#151717] mb-1 text-sm">Senha</label>
                <div className="border border-[#ecedec] rounded-xl h-12 flex items-center px-3 gap-2 focus-within:border-[#1e3a5f] transition-colors">
                  <svg height="20" viewBox="-64 0 512 512" width="20" className="text-gray-400 flex-shrink-0">
                    <path fill="currentColor" d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
                    <path fill="currentColor" d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
                  </svg>
                  <input type={showPass ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" className="flex-1 h-full text-sm border-none outline-none bg-transparent" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                    {showPass ? (
                      <svg viewBox="0 0 576 512" height="16" fill="currentColor"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-600">Lembrar de mim</span>
                </label>
                <Link href="/esqueci-senha" className="text-[#1e3a5f] font-medium hover:underline">Esqueceu a senha?</Link>
              </div>

              {loginError && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">{loginError}</p>
              )}

              <button type="submit" disabled={loginLoading} className="mt-1 bg-[#1e3a5f] text-white font-semibold rounded-xl h-12 w-full hover:bg-[#2a4f80] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loginLoading ? (
                  <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Entrando...</>
                ) : "Entrar"}
              </button>

              <p className="text-center text-sm text-gray-500">
                Não tem uma conta?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-[#1e3a5f] font-semibold hover:underline">
                  Criar conta grátis
                </button>
              </p>

              <div className="relative text-center text-sm text-gray-400 my-1">
                <div className="border-t border-gray-200 absolute top-1/2 left-0 right-0" />
                <span className="relative bg-white px-3">ou entre com</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => signIn("google", { callbackUrl })} className="flex-1 h-12 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                  <svg version="1.1" width="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path style={{ fill: "#FBBB00" }} d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z" />
                    <path style={{ fill: "#518EF8" }} d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" />
                    <path style={{ fill: "#28B446" }} d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" />
                    <path style={{ fill: "#F14336" }} d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z" />
                  </svg>
                  Google
                </button>
                <button type="button" title="Em breve" className="flex-1 h-12 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium opacity-50 cursor-not-allowed">
                  <svg viewBox="0 0 22.773 22.773" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z" />
                    <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z" />
                  </svg>
                  Apple <span className="text-xs text-gray-400">(em breve)</span>
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <div className="p-8 flex flex-col gap-4">
              <div>
                <p className="text-lg font-bold text-[#111] mb-0.5">Criar conta</p>
                <p className="text-sm text-gray-500">Comece com 7 dias grátis</p>
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <input
                  required type="text" value={rName} onChange={e => setRName(e.target.value)}
                  placeholder="Nome"
                  className="h-11 px-4 rounded-lg border border-[#e5e7eb] text-sm outline-none focus:border-[#1e3a5f] transition-colors bg-white w-full"
                />
                <input
                  required type="email" value={rEmail} onChange={e => setREmail(e.target.value)}
                  placeholder="E-mail"
                  className="h-11 px-4 rounded-lg border border-[#e5e7eb] text-sm outline-none focus:border-[#1e3a5f] transition-colors bg-white w-full"
                />
                <input
                  required type="password" value={rPassword} onChange={e => setRPassword(e.target.value)}
                  placeholder="Senha"
                  className="h-11 px-4 rounded-lg border border-[#e5e7eb] text-sm outline-none focus:border-[#1e3a5f] transition-colors bg-white w-full"
                />

                {registerError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{registerError}</p>
                )}

                <button type="submit" disabled={registerLoading} className="h-11 rounded-lg bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#2a4f80] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                  {registerLoading ? (
                    <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Cadastrando...</>
                  ) : "Criar conta"}
                </button>
              </form>

              <p className="text-sm text-[#374151] text-center">
                Já tem uma conta?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-[#1e3a5f] font-semibold hover:underline">
                  Entrar
                </button>
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  title="Em breve"
                  className="h-11 rounded-lg border border-[#d1d5db] bg-white flex items-center justify-center gap-2 text-sm font-medium text-[#374151] hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                >
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                    <path d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z" />
                  </svg>
                  Registrar com Apple <span className="text-xs text-gray-400">(em breve)</span>
                </button>

                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="h-11 rounded-lg border border-[#d1d5db] bg-white flex items-center justify-center gap-2 text-sm font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                >
                  <svg strokeWidth="0" version="1.1" viewBox="0 0 48 48" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  Registrar com Google
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2025 SolarPro • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
