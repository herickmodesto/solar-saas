"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface MesData {
  mes: string;
  consumido: number;
  compensado: number;
  valorFatura: number;
  valorAluguel: number;
}

const MESES_DEFAULT: MesData[] = [
  { mes: "Mar/2025", consumido: 9110, compensado: 7468, valorFatura: 4200, valorAluguel: 3800 },
  { mes: "Abr/2025", consumido: 7585, compensado: 7585, valorFatura: 3500, valorAluguel: 3200 },
  { mes: "Mai/2025", consumido: 7216, compensado: 7216, valorFatura: 3300, valorAluguel: 3000 },
  { mes: "Jun/2025", consumido: 7578, compensado: 7578, valorFatura: 3500, valorAluguel: 3200 },
  { mes: "Jul/2025", consumido: 8056, compensado: 8056, valorFatura: 3700, valorAluguel: 3400 },
  { mes: "Ago/2025", consumido: 7056, compensado: 7056, valorFatura: 3250, valorAluguel: 2950 },
];

export default function AnaliseMensalPage() {
  const { data: session } = useSession();
  const printRef = useRef<HTMLDivElement>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [cliente, setCliente] = useState("EMBRAESTER EMPRESA BRASILEIRA DE E. LTDA");
  const [usina, setUsina] = useState("Usina Solar 1 - 500 kWp");
  const [periodo, setPeriodo] = useState("Março a Agosto 2025");
  const [meses, setMeses] = useState<MesData[]>(MESES_DEFAULT);
  const [novoMes, setNovoMes] = useState<MesData>({ mes: "", consumido: 0, compensado: 0, valorFatura: 0, valorAluguel: 0 });

  const totalConsumido = meses.reduce((a, m) => a + m.consumido, 0);
  const totalCompensado = meses.reduce((a, m) => a + m.compensado, 0);
  const totalFatura = meses.reduce((a, m) => a + m.valorFatura, 0);
  const totalAluguel = meses.reduce((a, m) => a + m.valorAluguel, 0);
  const mediaAluguel = totalAluguel / (meses.length || 1);
  const percComp = totalConsumido > 0 ? (totalCompensado / totalConsumido) * 100 : 0;

  // CO2 e árvores
  const co2 = (totalCompensado * 0.0842) / 1000;
  const arvores = Math.round(totalCompensado / 275);

  const addMes = () => {
    if (novoMes.mes) {
      setMeses([...meses, novoMes]);
      setNovoMes({ mes: "", consumido: 0, compensado: 0, valorFatura: 0, valorAluguel: 0 });
    }
  };

  const handlePrint = async () => {
    if (session?.user?.id && !savedReportId) {
      try {
        const periodParts = periodo.split(" a ");
        const periodStart = new Date().toISOString();
        const periodEnd = new Date().toISOString();
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Análise Mensal — ${cliente}`,
            systemName: usina,
            periodStart,
            periodEnd,
            entries: meses.map((m) => ({
              month: new Date().toISOString(),
              consumedKwh: m.consumido,
              compensatedKwh: m.compensado,
              billValue: m.valorFatura,
              rentValue: m.valorAluguel,
            })),
          }),
        });
        const data = await res.json();
        if (res.ok && data.report?.id) setSavedReportId(data.report.id);
      } catch {
        // Fail silently
      }
    }
    window.print();
  };

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
            <span className="text-blue-200 text-sm">Análise Mensal de Vendas</span>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-200 hover:text-white">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Form de configuração */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 no-print">
          <h2 className="font-bold text-[#1e3a5f] text-lg mb-4">⚙️ Configurar Análise</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={cliente} onChange={e => setCliente(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Usina</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={usina} onChange={e => setUsina(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Período do Relatório</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={periodo} onChange={e => setPeriodo(e.target.value)} />
            </div>
          </div>

          {/* Adicionar mês */}
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Adicionar dados mensais</h3>
          <div className="grid grid-cols-6 gap-3 items-end">
            {[
              { label: "Mês/Ano", field: "mes", type: "text", placeholder: "Set/2025" },
              { label: "Consumido (kWh)", field: "consumido", type: "number" },
              { label: "Compensado (kWh)", field: "compensado", type: "number" },
              { label: "Valor Fatura (R$)", field: "valorFatura", type: "number" },
              { label: "Valor Aluguel (R$)", field: "valorAluguel", type: "number" },
            ].map((f) => (
              <div key={f.field}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder || ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={(novoMes as unknown as Record<string, string | number>)[f.field] || ""}
                  onChange={e => setNovoMes({ ...novoMes, [f.field]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                />
              </div>
            ))}
            <button onClick={addMes} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a4f80] h-[38px]">
              +
            </button>
          </div>
        </div>

        {/* Download button + Print */}
        <div className="flex gap-3 mb-6 no-print">
          <button
            onClick={handlePrint}
            className="cursor-pointer group relative flex gap-1.5 px-8 py-4 bg-black bg-opacity-80 text-[#f1f1f1] rounded-3xl hover:bg-opacity-70 transition font-semibold shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24px" width="24px">
              <g id="Interface / Download">
                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="#f1f1f1" d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" id="Vector" />
              </g>
            </svg>
            Baixar PDF
            <div className="absolute opacity-0 -bottom-full rounded-md py-2 px-2 bg-black bg-opacity-70 left-1/2 -translate-x-1/2 group-hover:opacity-100 transition-opacity shadow-lg text-sm whitespace-nowrap">
              Baixar PDF
            </div>
          </button>
        </div>

        {/* Relatório */}
        <div ref={printRef} className="bg-white shadow-lg rounded-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-[#1e3a5f] text-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
                  <span className="text-xl font-bold">SolarPro</span>
                </div>
                <div className="text-blue-200 text-sm">Análise Mensal de Vendas de Energia</div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold text-lg">Relatório de Energia Solar</div>
                <div className="text-blue-200 text-sm mt-1">Período: {periodo}</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Cliente e usina */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <div className="font-bold text-[#1e3a5f] mb-1">CLIENTE</div>
                <div className="text-gray-700">{cliente}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <div className="font-bold text-[#1e3a5f] mb-1">USINA</div>
                <div className="text-gray-700">{usina}</div>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                RESUMO DO PERÍODO
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Consumido", value: `${totalConsumido.toLocaleString("pt-BR")} kWh`, color: "bg-blue-50 text-blue-700" },
                  { label: "Total Compensado", value: `${totalCompensado.toLocaleString("pt-BR")} kWh`, color: "bg-green-50 text-green-700" },
                  { label: "% Compensação", value: `${percComp.toFixed(1)}%`, color: "bg-yellow-50 text-yellow-700" },
                  { label: "Total Aluguel", value: formatBRL(totalAluguel), color: "bg-[#1e3a5f] text-yellow-400" },
                ].map((k) => (
                  <div key={k.label} className={`rounded-xl p-4 text-center ${k.color}`}>
                    <div className="text-xs font-semibold mb-1 opacity-70">{k.label}</div>
                    <div className="text-xl font-extrabold">{k.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de barras simples (CSS) */}
            <div>
              <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                EVOLUÇÃO MENSAL
              </h2>
              <div className="flex items-end gap-3 h-36 mb-4">
                {meses.map((m, i) => {
                  const maxVal = Math.max(...meses.map(x => x.consumido));
                  const h1 = (m.consumido / maxVal) * 100;
                  const h2 = (m.compensado / maxVal) * 100;
                  const h3 = (m.valorAluguel / Math.max(...meses.map(x => x.valorAluguel))) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5 h-24">
                        <div className="w-3 bg-[#1e3a5f] rounded-t" style={{ height: `${h1}%` }} title={`Consumido: ${m.consumido}`} />
                        <div className="w-3 bg-yellow-400 rounded-t" style={{ height: `${h2}%` }} title={`Compensado: ${m.compensado}`} />
                        <div className="w-3 bg-green-500 rounded-t" style={{ height: `${h3}%` }} title={`Aluguel: ${m.valorAluguel}`} />
                      </div>
                      <div className="text-xs text-gray-500 text-center">{m.mes}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1e3a5f] rounded-sm" /> Consumido</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-sm" /> Compensado</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Aluguel</div>
              </div>
            </div>

            {/* Tabela */}
            <div>
              <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                DETALHAMENTO MENSAL
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="px-4 py-2 text-left">Mês</th>
                    <th className="px-4 py-2 text-right">Consumido (kWh)</th>
                    <th className="px-4 py-2 text-right">Compensado (kWh)</th>
                    <th className="px-4 py-2 text-right">% Comp.</th>
                    <th className="px-4 py-2 text-right">Valor Fatura</th>
                    <th className="px-4 py-2 text-right">Valor Aluguel</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((m, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-2 font-medium">{m.mes}</td>
                      <td className="px-4 py-2 text-right">{m.consumido.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-right">{m.compensado.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.consumido > 0 && (m.compensado / m.consumido) >= 0.9 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {m.consumido > 0 ? ((m.compensado / m.consumido) * 100).toFixed(0) : 0}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-red-600 font-medium">{formatBRL(m.valorFatura)}</td>
                      <td className="px-4 py-2 text-right text-green-700 font-bold">{formatBRL(m.valorAluguel)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#1e3a5f] text-white font-bold">
                    <td className="px-4 py-2">TOTAL</td>
                    <td className="px-4 py-2 text-right">{totalConsumido.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2 text-right">{totalCompensado.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2 text-right">{percComp.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right text-red-300">{formatBRL(totalFatura)}</td>
                    <td className="px-4 py-2 text-right text-yellow-400">{formatBRL(totalAluguel)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Média */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <div className="font-bold text-[#1e3a5f] mb-2">MÉDIAS DO PERÍODO</div>
                <div className="flex justify-between"><span>Média consumo mensal</span><span className="font-bold">{(totalConsumido / (meses.length || 1)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh</span></div>
                <div className="flex justify-between"><span>Média compensação mensal</span><span className="font-bold">{(totalCompensado / (meses.length || 1)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh</span></div>
                <div className="flex justify-between"><span>Média aluguel mensal</span><span className="font-bold text-green-700">{formatBRL(mediaAluguel)}</span></div>
              </div>
              <div>
                <div className="font-bold text-[#1e3a5f] mb-2 text-sm">IMPACTO AMBIENTAL ACUMULADO</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-lg">🌿</div>
                    <div className="font-bold text-green-700 text-sm">{co2.toFixed(2)} ton</div>
                    <div className="text-xs text-gray-400">CO₂ evitado</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-lg">🌳</div>
                    <div className="font-bold text-green-700 text-sm">{arvores}</div>
                    <div className="text-xs text-gray-400">Árvores salvas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center">
              Relatório gerado por SolarPro • {new Date().toLocaleDateString("pt-BR")} • Os valores são calculados com base nos dados inseridos.
            </div>
          </div>
        </div>
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
