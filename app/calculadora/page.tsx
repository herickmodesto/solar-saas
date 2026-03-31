"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

// Taxação por ano (GD Grupo B - resolução ANEEL)
const TAXACAO_ANUAL: Record<number, number> = {
  2024: 0.30, 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90,
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatNum(v: number, d = 4) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

interface Fatura {
  mes: string;
  consumido: number;
  compensado: number;
}

const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const DEFAULT_FATURAS: Fatura[] = [
  { mes: "Março/2025", consumido: 9110, compensado: 7468 },
  { mes: "Abril/2025", consumido: 7585, compensado: 7585 },
  { mes: "Maio/2025", consumido: 7216, compensado: 7216 },
  { mes: "Junho/2025", consumido: 7578, compensado: 7578 },
  { mes: "Julho/2025", consumido: 8056, compensado: 8056 },
  { mes: "Agosto/2025", consumido: 7056, compensado: 7056 },
];

export default function CalculadoraPage() {
  const { data: session } = useSession();
  const printRef = useRef<HTMLDivElement>(null);
  const [savedCalcId, setSavedCalcId] = useState<string | null>(null);

  // Tarifas
  const [te, setTe] = useState(0.31164);
  const [tusd, setTusd] = useState(0.4326);
  const [tusdFioB, setTusdFioB] = useState(0.24655);
  // Tributos
  const [pis, setPis] = useState(0.0117);
  const [cofins, setCofins] = useState(0.0537);
  const [icms, setIcms] = useState(0.20);
  // Desconto
  const [desconto, setDesconto] = useState(0.25);
  // Ano (taxação GD)
  const [ano, setAno] = useState(2025);
  // Cliente
  const [nomeCliente, setNomeCliente] = useState("EMBRAESTER EMPRESA BRASILEIRA DE E. LTDA");
  const [codigoCliente, setCodigoCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [locador, setLocador] = useState("");
  const [emailLocador, setEmailLocador] = useState("");
  // Fatura atual
  const [consumido, setConsumido] = useState(20080);
  const [compensado, setCompensado] = useState(15000);
  const [dataReferencia, setDataReferencia] = useState("2025-09-22");
  const [dataVencimento, setDataVencimento] = useState("2025-09-27");
  // Histórico
  const [faturas, setFaturas] = useState<Fatura[]>(DEFAULT_FATURAS);
  const [novaFatura, setNovaFatura] = useState<Fatura>({ mes: "", consumido: 0, compensado: 0 });
  const [tab, setTab] = useState<"calcular" | "historico" | "resultado">("calcular");

  const taxacao = TAXACAO_ANUAL[ano] ?? 0.45;

  // Cálculo principal (Grupo B Convencional)
  // Custos sem usina (com tributos sobre TE e TUSD)
  const teComTributos = te / (1 - pis - cofins - icms);
  const tusdComTributos = tusd / (1 - pis - cofins - icms);

  const valorTeSemUsina = consumido * te;
  const valorTusdSemUsina = consumido * tusd;
  const totalSemUsina = (valorTeSemUsina + valorTusdSemUsina) / (1 - pis - cofins - icms);

  // Custos com usina (desconto aplicado em TE e TUSD)
  const valorTeComUsina = compensado * te * (1 - desconto);
  const valorTusdComUsina = compensado * tusd * (1 - desconto);
  const totalTeComUsina = valorTeComUsina / (1 - pis - cofins - icms);
  const totalTusdComUsina = valorTusdComUsina / (1 - pis - cofins - icms);
  // Fio B = consumido × TUSD Fio B × taxação (pago sobre toda energia, sem desconto)
  const taxacaoFioB = compensado * tusdFioB * taxacao;
  const totalComUsina = totalTeComUsina + totalTusdComUsina + taxacaoFioB;

  // Valor do aluguel = TE+TUSD com usina (sem fio B)
  const valorAluguel = totalTeComUsina + totalTusdComUsina;

  // Custos com fio B incluído
  const custosComFioB = totalComUsina;

  // Economia
  const economia = totalSemUsina - totalComUsina;

  // CO2, árvores, energia limpa (acumulada histórico + atual)
  const totalCompensadoHist = faturas.reduce((acc, f) => acc + f.compensado, 0) + compensado;
  const co2 = totalCompensadoHist * 0.0842 / 1000;
  const arvores = totalCompensadoHist / 275;
  const energiaLimpa = totalCompensadoHist;

  const dtRef = dataReferencia ? new Date(dataReferencia).toLocaleDateString("pt-BR") : "—";
  const dtVenc = dataVencimento ? new Date(dataVencimento).toLocaleDateString("pt-BR") : "—";

  const saveCalculation = async () => {
    if (!session?.user?.id || savedCalcId) return;
    try {
      const res = await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teRate: te,
          tusdRate: tusd,
          tusdFioBRate: tusdFioB,
          pisRate: pis,
          cofinsRate: cofins,
          icmsRate: icms,
          referenceMonth: dataReferencia || new Date().toISOString(),
          consumedKwh: consumido,
          compensatedKwh: compensado,
          tariffDiscount: desconto,
          gdTaxYear: ano,
          costWithout: totalSemUsina,
          costWith: totalComUsina,
          rentValue: valorAluguel,
          savings: economia,
          co2Avoided: co2,
          treesSaved: Math.round(arvores),
        }),
      });
      const data = await res.json();
      if (res.ok && data.calculation?.id) setSavedCalcId(data.calculation.id);
    } catch {
      // Fail silently
    }
  };

  const addFatura = () => {
    if (novaFatura.mes && novaFatura.consumido > 0) {
      setFaturas([...faturas, novaFatura]);
      setNovaFatura({ mes: "", consumido: 0, compensado: 0 });
    }
  };

  const removeFatura = (i: number) => setFaturas(faturas.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1e3a5f] text-white px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
              <span className="text-xl font-bold">SolarPro</span>
            </Link>
            <span className="text-blue-300">/</span>
            <span className="text-blue-200 text-sm">Calculadora de Aluguel</span>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-200 hover:text-white">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 no-print">
          {[
            { key: "calcular", label: "⚙️ Configurar" },
            { key: "historico", label: "📋 Histórico" },
            { key: "resultado", label: "📊 Resultado" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t.key
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Configurar */}
        {tab === "calcular" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Dados do Cliente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] text-lg mb-4">👤 Dados do Cliente</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Cliente</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Código do Cliente</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={codigoCliente} onChange={e => setCodigoCliente(e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail do Cliente</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} />
                </div>
                <div className="border-t pt-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Locador (Proprietário da Usina)</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={locador} onChange={e => setLocador(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail do Locador</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={emailLocador} onChange={e => setEmailLocador(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Tarifas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] text-lg mb-4">⚡ Tarifas de Energia</h2>
              <div className="space-y-4">
                {[
                  { label: "TE (R$/kWh)", val: te, set: setTe },
                  { label: "TUSD (R$/kWh)", val: tusd, set: setTusd },
                  { label: "TUSD Fio B (R$/kWh)", val: tusdFioB, set: setTusdFioB },
                ].map((t) => (
                  <div key={t.label}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t.label}</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={t.val}
                      onChange={e => t.set(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Tributos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "PIS", val: pis, set: setPis },
                      { label: "COFINS", val: cofins, set: setCofins },
                      { label: "ICMS", val: icms, set: setIcms },
                    ].map((t) => (
                      <div key={t.label}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t.label}</label>
                        <input
                          type="number"
                          step="0.001"
                          value={t.val}
                          onChange={e => t.set(parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fatura do Mês */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] text-lg mb-4">🗒️ Fatura do Mês</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Energia Consumida (kWh)</label>
                    <input type="number" value={consumido} onChange={e => setConsumido(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Energia Compensada (kWh)</label>
                    <input type="number" value={compensado} onChange={e => setCompensado(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mês de Referência</label>
                    <input type="date" value={dataReferencia} onChange={e => setDataReferencia(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Vencimento</label>
                    <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações GD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] text-lg mb-4">📋 Configurações GD</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Desconto na Tarifa (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={desconto * 100}
                    onChange={e => setDesconto((parseFloat(e.target.value) || 0) / 100)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ano de Referência (taxação GD)</label>
                  <select
                    value={ano}
                    onChange={e => setAno(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TAXACAO_ANUAL).map(([y, t]) => (
                      <option key={y} value={y}>{y} — Taxação: {(t * 100).toFixed(0)}%</option>
                    ))}
                  </select>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 mb-3">ESCALONAMENTO DE TAXAÇÃO GD (ANEEL)</div>
                  <div className="space-y-1">
                    {Object.entries(TAXACAO_ANUAL).map(([y, t]) => (
                      <div key={y} className={`flex justify-between text-sm ${parseInt(y) === ano ? "font-bold text-blue-800" : "text-gray-600"}`}>
                        <span>{y}</span>
                        <span>{(t * 100).toFixed(0)}% de taxação no Fio B</span>
                        {parseInt(y) === ano && <span className="text-blue-600 text-xs">← atual</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setTab("resultado"); saveCalculation(); }}
                className="mt-6 w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors"
              >
                Calcular e Ver Resultado →
              </button>
            </div>
          </div>
        )}

        {/* Tab: Histórico */}
        {tab === "historico" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#1e3a5f] text-lg mb-6">📋 Histórico de Faturas (Demonstrativo)</h2>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Adicionar fatura</h3>
              <div className="grid grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mês/Ano</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Março/2025"
                    value={novaFatura.mes}
                    onChange={e => setNovaFatura({ ...novaFatura, mes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Consumido (kWh)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novaFatura.consumido || ""}
                    onChange={e => setNovaFatura({ ...novaFatura, consumido: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Compensado (kWh)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novaFatura.compensado || ""}
                    onChange={e => setNovaFatura({ ...novaFatura, compensado: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <button
                  onClick={addFatura}
                  className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a4f80] transition-colors"
                >
                  + Adicionar
                </button>
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="px-4 py-2 text-left">Mês</th>
                  <th className="px-4 py-2 text-right">Consumido (kWh)</th>
                  <th className="px-4 py-2 text-right">Compensado (kWh)</th>
                  <th className="px-4 py-2 text-right">Acumulado (kWh)</th>
                  <th className="px-4 py-2 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((f, i) => {
                  const acumulado = faturas.slice(0, i + 1).reduce((acc, x) => acc + x.compensado, 0);
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-2">{f.mes}</td>
                      <td className="px-4 py-2 text-right">{f.consumido.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-right">{f.compensado.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-right">{acumulado.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeFatura(i)} className="text-red-400 hover:text-red-600 text-xs font-semibold">Remover</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Resultado */}
        {tab === "resultado" && (
          <>
            <div className="flex gap-3 mb-6 no-print">
              <button
                onClick={() => window.print()}
                className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors text-sm flex items-center gap-2"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>

            <div ref={printRef} className="bg-white shadow-lg rounded-2xl overflow-hidden max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-[#1e3a5f] text-white px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
                      <span className="text-xl font-bold">SolarPro</span>
                    </div>
                    <div className="text-blue-200 text-sm mt-1">Demonstrativo de Economia</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-yellow-400 font-bold">Aluguel de Usinas Fotovoltaicas</div>
                    <div className="text-blue-200 mt-1">{dtRef} | Venc: {dtVenc}</div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Info cliente e locador */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                    <div className="font-bold text-[#1e3a5f] mb-2">CLIENTE</div>
                    <div><strong>Nome:</strong> {nomeCliente || "—"}</div>
                    {codigoCliente && <div><strong>Código:</strong> {codigoCliente}</div>}
                    {emailCliente && <div><strong>E-mail:</strong> {emailCliente}</div>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                    <div className="font-bold text-[#1e3a5f] mb-2">LOCADOR</div>
                    <div>{locador || "—"}</div>
                    {emailLocador && <div>{emailLocador}</div>}
                  </div>
                </div>

                {/* Tarifas usadas */}
                <div>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    TARIFAS E TRIBUTOS UTILIZADOS
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span>TE:</span><span className="font-mono">{formatNum(te)}</span></div>
                      <div className="flex justify-between"><span>TUSD:</span><span className="font-mono">{formatNum(tusd)}</span></div>
                      <div className="flex justify-between"><span>TUSD Fio B:</span><span className="font-mono">{formatNum(tusdFioB)}</span></div>
                      <div className="flex justify-between"><span>Taxação {ano}:</span><span className="font-mono font-bold text-[#1e3a5f]">{(taxacao * 100).toFixed(0)}%</span></div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span>PIS:</span><span className="font-mono">{(pis * 100).toFixed(2)}%</span></div>
                      <div className="flex justify-between"><span>COFINS:</span><span className="font-mono">{(cofins * 100).toFixed(2)}%</span></div>
                      <div className="flex justify-between"><span>ICMS:</span><span className="font-mono">{(icms * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span>Desconto:</span><span className="font-mono font-bold text-green-700">{(desconto * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>

                {/* Cálculo */}
                <div>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    CÁLCULO
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Sem usina */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm">CUSTOS SEM USINA</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between bg-red-50 px-3 py-2 rounded-lg">
                          <span>Valor TE (R$)</span>
                          <span className="font-bold">{formatBRL(valorTeSemUsina / (1 - pis - cofins - icms))}</span>
                        </div>
                        <div className="flex justify-between bg-red-50 px-3 py-2 rounded-lg">
                          <span>Valor TUSD (R$)</span>
                          <span className="font-bold">{formatBRL(valorTusdSemUsina / (1 - pis - cofins - icms))}</span>
                        </div>
                        <div className="flex justify-between bg-red-100 px-3 py-2 rounded-lg font-bold">
                          <span>Total (R$)</span>
                          <span className="text-red-700">{formatBRL(totalSemUsina)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Com usina */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm">CUSTOS COM USINA (DESC. {(desconto * 100).toFixed(0)}%)</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                          <span>Valor TE (R$)</span>
                          <span className="font-bold">{formatBRL(totalTeComUsina)}</span>
                        </div>
                        <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                          <span>Valor TUSD (R$)</span>
                          <span className="font-bold">{formatBRL(totalTusdComUsina)}</span>
                        </div>
                        <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                          <span>Taxação Fio B (R$)</span>
                          <span className="font-bold">{formatBRL(taxacaoFioB)}</span>
                        </div>
                        <div className="flex justify-between bg-green-100 px-3 py-2 rounded-lg font-bold">
                          <span>Total com Fio B (R$)</span>
                          <span className="text-green-700">{formatBRL(custosComFioB)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo fatura */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Custos sem Usina</div>
                    <div className="text-xl font-extrabold text-red-600">{formatBRL(totalSemUsina)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Custos Totais com Fio B</div>
                    <div className="text-xl font-extrabold text-blue-600">{formatBRL(custosComFioB)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Custos com Usina</div>
                    <div className="text-xl font-extrabold text-green-700">{formatBRL(totalComUsina)}</div>
                  </div>
                </div>

                {/* Fatura */}
                <div>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    FATURA
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#1e3a5f] text-white">
                          <th className="px-4 py-2 text-left">Mês</th>
                          <th className="px-4 py-2 text-right">Energia Consumida</th>
                          <th className="px-4 py-2 text-right">Energia Compensada</th>
                          <th className="px-4 py-2 text-right">Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faturas.map((f, i) => {
                          const acum = faturas.slice(0, i + 1).reduce((a, x) => a + x.compensado, 0);
                          return (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="px-4 py-2">{f.mes}</td>
                              <td className="px-4 py-2 text-right">{f.consumido.toLocaleString("pt-BR")} kWh</td>
                              <td className="px-4 py-2 text-right">{f.compensado.toLocaleString("pt-BR")} kWh</td>
                              <td className="px-4 py-2 text-right">{acum.toLocaleString("pt-BR")} kWh</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-blue-50 font-semibold">
                          <td className="px-4 py-2">Mês atual</td>
                          <td className="px-4 py-2 text-right">{consumido.toLocaleString("pt-BR")} kWh</td>
                          <td className="px-4 py-2 text-right">{compensado.toLocaleString("pt-BR")} kWh</td>
                          <td className="px-4 py-2 text-right">{(faturas.reduce((a, f) => a + f.compensado, 0) + compensado).toLocaleString("pt-BR")} kWh</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Impacto ambiental */}
                <div>
                  <h3 className="font-semibold text-gray-600 mb-3 text-sm">Você ajudou o meio ambiente com:</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-2xl mb-1">🌿</div>
                      <div className="font-bold text-green-700">{co2.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">ton CO₂</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-2xl mb-1">🌳</div>
                      <div className="font-bold text-green-700">{arvores.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Árvores plantadas</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="font-bold text-green-700">{energiaLimpa.toLocaleString("pt-BR")}</div>
                      <div className="text-xs text-gray-500">kWh limpa consumida</div>
                    </div>
                  </div>
                </div>

                {/* DESTAQUE: Valor do Aluguel */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#1e3a5f] text-white rounded-2xl p-6 text-center">
                    <div className="text-sm text-blue-200 font-semibold mb-1">MÊS DE REFERÊNCIA</div>
                    <div className="text-lg font-bold">{dtRef}</div>
                    <div className="text-sm text-blue-200 mt-1">Vencimento: {dtVenc}</div>
                  </div>
                  <div className="bg-yellow-400 rounded-2xl p-6 text-center">
                    <div className="text-sm text-[#1e3a5f] font-extrabold mb-1">VALOR DO ALUGUEL</div>
                    <div className="text-3xl font-extrabold text-[#1e3a5f]">{formatBRL(valorAluguel)}</div>
                    <div className="text-sm text-[#1e3a5f] mt-1">Economia: {formatBRL(economia)}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
}
