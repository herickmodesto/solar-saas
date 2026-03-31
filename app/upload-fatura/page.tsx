"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface ArquivoUpload {
  id: string;
  nome: string;
  tamanho: number;
  tipo: string;
  progresso: number;
  status: "uploading" | "complete" | "error";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const TIPOS_ACEITOS = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadFaturaPage() {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageUsed = arquivos.filter(a => a.status === "complete").reduce((acc, a) => acc + a.tamanho, 0);
  const storageMax = 10 * 1024 * 1024 * 1024; // 10GB
  const storagePerc = Math.min((storageUsed / storageMax) * 100, 100);

  const [erros, setErros] = useState<string[]>([]);

  const processarArquivos = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!TIPOS_ACEITOS.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i)) {
        setErros(prev => [...prev, `Tipo não suportado: ${file.name}`]);
        return;
      }
      if (file.size > MAX_SIZE) {
        setErros(prev => [...prev, `Arquivo muito grande: ${file.name} (máx 10MB)`]);
        return;
      }
      const id = Date.now().toString() + Math.random().toString(36).slice(2);
      const novoArquivo: ArquivoUpload = {
        id,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type || file.name.split(".").pop()?.toUpperCase() || "FILE",
        progresso: 0,
        status: "uploading",
      };
      setArquivos(prev => [...prev, novoArquivo]);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          setArquivos(prev => prev.map(a => a.id === id ? { ...a, progresso: p } : a));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 201) {
          setArquivos(prev => prev.map(a => a.id === id ? { ...a, progresso: 100, status: "complete" } : a));
        } else {
          let msg = "Erro ao enviar arquivo.";
          try { msg = JSON.parse(xhr.responseText).error ?? msg; } catch { /* noop */ }
          setArquivos(prev => prev.map(a => a.id === id ? { ...a, status: "error" } : a));
          setErros(prev => [...prev, `${file.name}: ${msg}`]);
        }
      };
      xhr.onerror = () => {
        setArquivos(prev => prev.map(a => a.id === id ? { ...a, status: "error" } : a));
        setErros(prev => [...prev, `${file.name}: Falha de conexão.`]);
      };
      xhr.send(formData);
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processarArquivos(e.dataTransfer.files);
  }, [processarArquivos]);

  const removerArquivo = (id: string) =>
    setArquivos(prev => prev.filter(a => a.id !== id));

  const limparTodos = () => setArquivos([]);

  const getIcone = (tipo: string) => {
    if (tipo.includes("pdf") || tipo.toLowerCase() === "pdf") return { icon: "📄", color: "text-red-500", bg: "bg-red-500/10" };
    if (tipo.includes("image") || ["jpg", "jpeg", "png"].includes(tipo.toLowerCase())) return { icon: "🖼️", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    return { icon: "📃", color: "text-cyan-500", bg: "bg-cyan-500/10" };
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center text-sm">☀️</div>
          <span className="font-bold text-white">SolarPro</span>
        </div>
      </div>

      {/* Card principal */}
      <div className="group relative w-full max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10">
          {/* Glow effects */}
          <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
          <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />

          <div className="relative p-6">
            {/* Erros de validação */}
            {erros.length > 0 && (
              <div className="mb-4 space-y-1">
                {erros.map((e, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-sm text-red-400">
                    <span>{e}</span>
                    <button onClick={() => setErros(prev => prev.filter((_, j) => j !== i))} className="ml-2 text-red-400 hover:text-red-300">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Header do card */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Enviar Faturas</h3>
                <p className="text-sm text-slate-400">Arraste e solte seus arquivos de fatura aqui</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <svg className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>

            {/* Dropzone */}
            <div
              className={`group/dropzone relative rounded-xl border-2 border-dashed p-8 transition-all ${dragging ? "border-cyan-500 bg-cyan-500/5" : "border-slate-700 bg-slate-900/50 hover:border-cyan-500/50"}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => processarArquivos(e.target.files)}
              />
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
                  <svg className={`h-10 w-10 transition-colors ${dragging ? "text-cyan-400" : "text-cyan-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-white">
                    {dragging ? "Solte os arquivos aqui!" : "Arraste os arquivos ou clique para selecionar"}
                  </p>
                  <p className="text-sm text-slate-400">Suporta: PDF, DOC, DOCX, JPG, PNG</p>
                  <p className="text-xs text-slate-500">Tamanho máximo: 10MB por arquivo</p>
                </div>
              </div>
            </div>

            {/* Lista de arquivos */}
            {arquivos.length > 0 && (
              <div className="mt-6 space-y-3">
                {arquivos.map(arq => {
                  const { icon, color, bg } = getIcone(arq.tipo);
                  return (
                    <div key={arq.id} className="rounded-xl bg-slate-900/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg ${bg} p-2`}>
                            <span className="text-xl">{icon}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm truncate max-w-[200px]">{arq.nome}</p>
                            <p className="text-xs text-slate-400">
                              {formatBytes(arq.tamanho)} • {arq.tipo.split("/")[1]?.toUpperCase() || arq.tipo.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {arq.status === "uploading" ? (
                            <span className={`text-sm font-medium ${color}`}>{arq.progresso}%</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm font-medium text-emerald-500">Enviado</span>
                            </div>
                          )}
                          <button
                            onClick={() => removerArquivo(arq.id)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {arq.status === "uploading" && (
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-300"
                            style={{ width: `${arq.progresso}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Storage info */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Armazenamento Usado</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{formatBytes(storageUsed)}</span>
                  <span className="text-sm text-slate-400">/ 10 GB</span>
                </div>
              </div>
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                  <circle
                    cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={100 - storagePerc}
                    className="text-cyan-500 transition-all duration-500"
                  />
                </svg>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white">
                  {storagePerc.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => inputRef.current?.click()}
                className="group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-px font-medium text-white shadow-lg transition-colors"
              >
                <span className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-950/50 px-4 py-2 transition-colors group-hover/btn:bg-transparent">
                  Enviar Mais
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </span>
              </button>
              <button
                onClick={limparTodos}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800 text-sm"
              >
                Limpar Tudo
              </button>
            </div>

            {/* Dica */}
            {arquivos.some(a => a.status === "complete") && (
              <div className="mt-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-sm text-cyan-300">
                <strong>✅ Arquivos enviados!</strong> Acesse a{" "}
                <Link href="/calculadora" className="underline font-semibold hover:text-cyan-100">
                  Calculadora de Aluguel
                </Link>{" "}
                ou{" "}
                <Link href="/analise-mensal" className="underline font-semibold hover:text-cyan-100">
                  Análise Mensal
                </Link>{" "}
                para processar seus dados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
