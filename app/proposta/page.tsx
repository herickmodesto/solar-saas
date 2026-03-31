"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface PropostaData {
  // Cliente
  nomeCliente: string;
  email: string;
  cpf: string;
  contato: string;
  endereco: string;
  cidade: string;
  estado: string;
  // Empresa
  nomeEmpresa: string;
  cnpjEmpresa: string;
  contatoEmpresa: string;
  // Sistema
  numModulos: number;
  potenciaModulo: number;
  consumoMensal: number;
  valorInvestimento: number;
  custoAtualEnergia: number;
  desconto: number;
  taxaInflacao: number;
  // Equipamentos
  marcaModulo: string;
  modeloModulo: string;
  marcaInversor: string;
  modeloInversor: string;
  qtdInversor: number;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// Fator solar médio por mês (Natal/RN como referência)
const FATORES_SOLAR = [1.060, 1.064, 1.072, 0.980, 0.894, 0.820, 0.841, 0.982, 1.053, 1.078, 1.104, 1.051];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatNum(v: number, decimals = 2) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function PropostaPage() {
  const { data: session } = useSession();
  const printRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [data, setData] = useState<PropostaData>({
    nomeCliente: "",
    email: "",
    cpf: "",
    contato: "",
    endereco: "",
    cidade: "",
    estado: "",
    nomeEmpresa: "",
    cnpjEmpresa: "",
    contatoEmpresa: "",
    numModulos: 128,
    potenciaModulo: 700,
    consumoMensal: 10240,
    valorInvestimento: 195000,
    custoAtualEnergia: 10362.88,
    desconto: 25,
    taxaInflacao: 7,
    marcaModulo: "Canadian",
    modeloModulo: "700W",
    marcaInversor: "Canadian",
    modeloInversor: "75KW",
    qtdInversor: 1,
  });

  const set = (field: keyof PropostaData, value: string | number) =>
    setData((d) => ({ ...d, [field]: value }));

  // Cálculos
  const potenciakWp = (data.numModulos * data.potenciaModulo) / 1000;
  const areaNecessaria = data.numModulos * 3.1;
  // Geração estimada (média ~4.5h sol pico/dia para Natal)
  const geracaoMensal = potenciakWp * 4.5 * 30 * 0.8; // fator de eficiência 0.8
  const geracaoAnual = geracaoMensal * 12;

  // Produção mensal
  const producaoMensal = FATORES_SOLAR.map((f) => ({
    mes: "",
    geracao: geracaoMensal * f,
    consumo: data.consumoMensal * f * 0.9,
  }));

  // Economia
  const custoInstalacao = data.custoAtualEnergia * (1 - data.desconto / 100);
  const economiaEsperada = data.custoAtualEnergia - custoInstalacao;
  const economiaPerc = (economiaEsperada / data.custoAtualEnergia) * 100;

  // Payback
  const paybackMeses = Math.ceil(data.valorInvestimento / economiaEsperada);
  const paybackAnos = Math.floor(paybackMeses / 12);
  const paybackMesesRest = paybackMeses % 12;

  // Economia 25 anos com inflação
  let economia25 = 0;
  let economiaAnual = economiaEsperada * 12;
  for (let i = 0; i < 25; i++) {
    economia25 += economiaAnual;
    economiaAnual *= 1 + data.taxaInflacao / 100;
  }
  // Degradação: 20% em 25 anos
  economia25 *= 0.9;

  // ROI solar (% ao ano)
  const roiSolar = (economia25 / 25 / data.valorInvestimento) * 100;

  // CO2, árvores, km
  const co2Ano = (geracaoAnual * 0.0842) / 1000; // ton CO2
  const arvoresAno = Math.round(geracaoAnual / 275);
  const kmAno = Math.round(geracaoAnual * 185);

  const propostaNum = `#${Math.floor(700000 + Math.random() * 100000)}`;
  const hoje = new Date().toLocaleDateString("pt-BR");
  const validade = new Date(Date.now() + 20 * 86400000).toLocaleDateString("pt-BR");

  const handlePrint = () => {
    window.print();
  };

  const saveProposal = async () => {
    if (!session?.user?.id || savedId) return;
    try {
      // 1. Cria ou reutiliza o cliente
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.nomeCliente || "Cliente",
          email: data.email || undefined,
          cpf: data.cpf || undefined,
          phone: data.contato || undefined,
          address: data.endereco || undefined,
          city: data.cidade || undefined,
          state: data.estado || undefined,
          companyName: data.nomeEmpresa || undefined,
          companyCnpj: data.cnpjEmpresa || undefined,
        }),
      });
      const clientData = await clientRes.json();
      const clientId = clientData.client?.id;
      if (!clientId) return;

      // 2. Cria a proposta
      const propRes = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          numModules: data.numModulos,
          modulePower: data.potenciaModulo,
          systemKwp: potenciakWp,
          monthlyGenKwh: geracaoMensal,
          requiredAreaM2: areaNecessaria,
          investmentValue: data.valorInvestimento,
          monthlyConsumptionKwh: data.consumoMensal,
          currentEnergyCost: data.custoAtualEnergia,
          tariffDiscount: data.desconto,
          inflationRate: data.taxaInflacao,
          monthlyEconomy: economiaEsperada,
          paybackMonths: paybackMeses,
          savings25y: economia25,
          modulesBrand: data.marcaModulo,
          modulesModel: data.modeloModulo,
          inverterBrand: data.marcaInversor,
          inverterModel: data.modeloInversor,
          inverterQuantity: data.qtdInversor,
          co2TonsAvoided: co2Ano,
          treesSaved: arvoresAno,
          kmEquivalent: kmAno,
        }),
      });
      const propData = await propRes.json();
      if (propRes.ok && propData.proposal?.id) setSavedId(propData.proposal.id);
    } catch {
      // Fail silently — user can still print
    }
  };

  const InputField = ({ label, field, type = "text", placeholder = "" }: {
    label: string; field: keyof PropostaData; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={data[field] as string | number}
        onChange={(e) => set(field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
              <span className="text-xl font-bold">SolarPro</span>
            </Link>
            <span className="text-blue-300">/</span>
            <span className="text-blue-200 text-sm">Gerador de Propostas</span>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-200 hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 no-print overflow-x-auto pb-2">
          {[
            { n: 1, label: "Dados do Cliente" },
            { n: 2, label: "Sistema Solar" },
            { n: 3, label: "Equipamentos" },
            { n: 4, label: "Visualizar Proposta" },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${step === s.n
                  ? "bg-[#1e3a5f] text-white"
                  : step > s.n
                    ? "bg-green-100 text-green-700"
                    : "bg-white text-gray-400 border border-gray-200"
                }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? "bg-yellow-400 text-[#1e3a5f]" : step > s.n ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s.n ? "✓" : s.n}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 no-print">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">📋 Dados do Cliente e Empresa</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Cliente</h3>
                <div className="space-y-4">
                  <InputField label="Nome Completo" field="nomeCliente" placeholder="Ex: João Silva" />
                  <InputField label="E-mail" field="email" type="email" placeholder="email@exemplo.com" />
                  <InputField label="CPF/CNPJ" field="cpf" placeholder="000.000.000-00" />
                  <InputField label="Contato (WhatsApp)" field="contato" placeholder="(84) 99999-9999" />
                  <InputField label="Endereço" field="endereco" placeholder="Rua, número" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Cidade" field="cidade" placeholder="Natal" />
                    <InputField label="Estado" field="estado" placeholder="RN" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Sua Empresa</h3>
                <div className="space-y-4">
                  <InputField label="Nome da Empresa" field="nomeEmpresa" placeholder="Casa Solar" />
                  <InputField label="CNPJ" field="cnpjEmpresa" placeholder="00.000.000/0001-00" />
                  <InputField label="WhatsApp Comercial" field="contatoEmpresa" placeholder="(84) 99999-9999" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors"
              >
                Próximo: Sistema Solar →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 no-print">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">⚡ Dimensionamento do Sistema</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Sistema Fotovoltaico</h3>
                <InputField label="Número de Módulos" field="numModulos" type="number" />
                <InputField label="Potência do Módulo (W)" field="potenciaModulo" type="number" />
                <InputField label="Consumo Mensal Base (kWh)" field="consumoMensal" type="number" />

                {/* Preview calculado */}
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-blue-600 mb-2">CÁLCULO AUTOMÁTICO</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Potência do Projeto</span>
                    <span className="font-bold text-[#1e3a5f]">{formatNum(potenciakWp)} kWp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Geração Estimada</span>
                    <span className="font-bold text-[#1e3a5f]">{formatNum(geracaoMensal)} kWh/mês</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Área Necessária</span>
                    <span className="font-bold text-[#1e3a5f]">{formatNum(areaNecessaria)} m²</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Análise Financeira</h3>
                <InputField label="Custo Atual com Energia (R$/mês)" field="custoAtualEnergia" type="number" />
                <InputField label="Valor do Investimento (R$)" field="valorInvestimento" type="number" />
                <InputField label="Desconto na Tarifa (%)" field="desconto" type="number" />
                <InputField label="Taxa de Inflação Energética (% a.a.)" field="taxaInflacao" type="number" />

                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-green-600 mb-2">RESULTADO FINANCEIRO</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Economia Mensal</span>
                    <span className="font-bold text-green-700">{formatBRL(economiaEsperada)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payback</span>
                    <span className="font-bold text-green-700">{paybackAnos} ano(s) e {paybackMesesRest} meses</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Economia em 25 anos</span>
                    <span className="font-bold text-green-700">{formatBRL(economia25)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-500 px-6 py-3 rounded-xl border border-gray-200 font-semibold hover:bg-gray-50 transition-colors">
                ← Voltar
              </button>
              <button onClick={() => setStep(3)} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors">
                Próximo: Equipamentos →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 no-print">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">🔧 Equipamentos</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Módulos Fotovoltaicos</h3>
                <InputField label="Marca" field="marcaModulo" placeholder="Canadian, Jinko, BYD..." />
                <InputField label="Modelo" field="modeloModulo" placeholder="700W" />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Inversor</h3>
                <InputField label="Marca" field="marcaInversor" placeholder="Deye, GoodWe, Huawei..." />
                <InputField label="Modelo/Potência" field="modeloInversor" placeholder="75KW" />
                <InputField label="Quantidade" field="qtdInversor" type="number" />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-500 px-6 py-3 rounded-xl border border-gray-200 font-semibold hover:bg-gray-50 transition-colors">
                ← Voltar
              </button>
              <button
                onClick={() => { setStep(4); saveProposal(); }}
                className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors"
              >
                Visualizar Proposta →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 - Proposta */}
        {step === 4 && (
          <>
            {/* Print actions */}
            <div className="flex gap-3 mb-6 no-print">
              <button onClick={() => setStep(3)} className="text-gray-500 px-6 py-3 rounded-xl border border-gray-200 font-semibold hover:bg-gray-50 transition-colors text-sm">
                ← Editar
              </button>
              <button
                onClick={handlePrint}
                className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2a4f80] transition-colors text-sm flex items-center gap-2"
              >
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>

            {/* Proposta Document */}
            <div ref={printRef} className="bg-white shadow-lg rounded-2xl overflow-hidden max-w-4xl mx-auto">
              {/* Header da Proposta */}
              <div className="bg-[#1e3a5f] text-white px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-lg">☀️</div>
                      <span className="text-2xl font-extrabold">{data.nomeEmpresa || "SolarPro"}</span>
                    </div>
                    <div className="text-blue-200 text-sm">CNPJ: {data.cnpjEmpresa || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">Proposta {propostaNum}</div>
                    <div className="text-blue-200 text-sm">PROPOSTA ON-GRID</div>
                    <div className="text-blue-200 text-xs mt-1">Criada: {hoje} | Válida até: {validade}</div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Informações do Cliente */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    INFORMAÇÕES DO CLIENTE
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1 text-sm">
                      <div><strong>Nome:</strong> {data.nomeCliente || "—"}</div>
                      <div><strong>E-mail:</strong> {data.email || "—"}</div>
                      <div><strong>CPF/CNPJ:</strong> {data.cpf || "—"}</div>
                      <div><strong>Contato:</strong> {data.contato || "—"}</div>
                      <div><strong>Endereço:</strong> {data.endereco || "—"}</div>
                      <div><strong>Cidade/Estado:</strong> {data.cidade || "—"}, {data.estado || "—"}</div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Custo atual (mensal):</strong> <span className="text-red-600 font-bold">{formatBRL(data.custoAtualEnergia)}</span></div>
                      <div><strong>Custo com sistema:</strong> <span className="text-green-600 font-bold">{formatBRL(custoInstalacao)}</span></div>
                      <div><strong>Economia mensal esperada:</strong> <span className="text-green-700 font-bold">{formatBRL(economiaEsperada)}</span></div>
                      <div><strong>Economia esperada (%):</strong> <span className="text-green-700 font-bold">{formatNum(economiaPerc, 1)}%</span></div>
                    </div>
                  </div>
                </section>

                {/* Escopo do Projeto */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    ESCOPO DO PROJETO
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Módulos Fotovoltaicos", `${data.numModulos} unidades`],
                      ["Potência do Projeto", `${formatNum(potenciakWp)} kWp`],
                      ["Base de Consumo", `${formatNum(data.consumoMensal, 0)} kWh/mês`],
                      ["Geração Estimada", `${formatNum(geracaoMensal)} kWh/mês`],
                      ["Percentual de Energia Solar", "100%"],
                      ["Área Necessária", `${formatNum(areaNecessaria)} m²`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3 text-sm">
                        <span className="font-semibold text-gray-700">{label}</span>
                        <span className="font-bold text-[#1e3a5f]">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Produção Anual */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    PRODUÇÃO ANUAL DE ENERGIA
                  </h2>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-4">
                    {MESES.map((mes, i) => {
                      const ger = geracaoMensal * FATORES_SOLAR[i];
                      const cons = data.consumoMensal * FATORES_SOLAR[i] * 0.9;
                      const maxVal = geracaoMensal * 1.2;
                      return (
                        <div key={mes} className="text-center">
                          <div className="flex flex-col justify-end h-16 gap-0.5 mb-1">
                            <div
                              className="bg-[#1e3a5f] rounded-sm mx-auto"
                              style={{ width: "10px", height: `${(ger / maxVal) * 60}px` }}
                            />
                            <div
                              className="bg-yellow-400 rounded-sm mx-auto"
                              style={{ width: "10px", height: `${(cons / maxVal) * 60}px` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">{mes}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1e3a5f] rounded-sm" /> Geração</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-sm" /> Consumo</div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1e3a5f] text-white">
                          <td className="px-2 py-1"></td>
                          {MESES.map((m) => <td key={m} className="px-2 py-1 text-center">{m}</td>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-50">
                          <td className="px-2 py-1 font-semibold text-[#1e3a5f]">Geração</td>
                          {MESES.map((_, i) => (
                            <td key={i} className="px-2 py-1 text-center">{formatNum(geracaoMensal * FATORES_SOLAR[i], 0)}</td>
                          ))}
                        </tr>
                        <tr className="bg-yellow-50">
                          <td className="px-2 py-1 font-semibold text-yellow-700">Consumo</td>
                          {MESES.map((_, i) => (
                            <td key={i} className="px-2 py-1 text-center">{formatNum(data.consumoMensal * FATORES_SOLAR[i] * 0.9, 0)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Análise Financeira */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    ANÁLISE FINANCEIRA
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="font-semibold">Valor da Proposta</span><span className="font-bold text-[#1e3a5f]">{formatBRL(data.valorInvestimento)}</span></div>
                      <div className="flex justify-between"><span>Tempo de vida mínima</span><span>25 Anos</span></div>
                      <div className="flex justify-between"><span>Taxa de inflação anual</span><span>{data.taxaInflacao}% ao ano</span></div>
                      <div className="flex justify-between"><span>Perda de eficiência</span><span>20% em 25 anos</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">Poupança</div>
                        <div className="font-bold text-blue-600">0,63%</div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">CDI</div>
                        <div className="font-bold text-blue-600">1,13%</div>
                      </div>
                      <div className="bg-yellow-400 rounded-xl p-3 text-center">
                        <div className="text-xs text-[#1e3a5f] font-semibold mb-1">Energia Solar</div>
                        <div className="font-bold text-[#1e3a5f]">{formatNum(roiSolar, 1)}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#1e3a5f] text-white rounded-2xl p-6 text-center">
                      <div className="text-sm text-blue-200 mb-2">PAYBACK — Tempo de retorno</div>
                      <div className="text-3xl font-extrabold text-yellow-400">
                        {paybackAnos} ANO{paybackAnos !== 1 ? "S" : ""} E {paybackMesesRest} MESES
                      </div>
                    </div>
                    <div className="bg-yellow-400 rounded-2xl p-6 text-center">
                      <div className="text-sm text-[#1e3a5f] font-semibold mb-2">ECONOMIA EM 25 ANOS</div>
                      <div className="text-3xl font-extrabold text-[#1e3a5f]">{formatBRL(economia25)}</div>
                    </div>
                  </div>
                </section>

                {/* Equipamentos */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    INVESTIMENTO PROPOSTO
                  </h2>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="px-4 py-2 text-left">Equipamento</th>
                        <th className="px-4 py-2 text-left">Marca/Modelo</th>
                        <th className="px-4 py-2 text-center">Qtd</th>
                        <th className="px-4 py-2 text-center">Garantia</th>
                        <th className="px-4 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Módulos Fotovoltaicos", `${data.marcaModulo} ${data.modeloModulo}`, data.numModulos, "12 anos", ""],
                        ["Inversor", `${data.marcaInversor} ${data.modeloInversor}`, data.qtdInversor, "10 anos", ""],
                        ["Estrutura de Fixação", "Incluso", 1, "10 anos", ""],
                        ["Stringbox", "Incluso", "Incluso", "3 anos", ""],
                        ["Cabos e Conectores", "Incluso", "Incluso", "3 anos", ""],
                        ["Serviços", "Projeto, instalação, homologação", "—", "2 anos", ""],
                      ].map(([equip, marca, qtd, gar, val], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-4 py-2 font-semibold">{equip}</td>
                          <td className="px-4 py-2 text-gray-600">{marca}</td>
                          <td className="px-4 py-2 text-center">{qtd}</td>
                          <td className="px-4 py-2 text-center">{gar}</td>
                          <td className="px-4 py-2 text-right">{i === 0 ? formatBRL(data.valorInvestimento) : "—"}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#1e3a5f] text-white font-bold">
                        <td className="px-4 py-3 text-lg" colSpan={4}>TOTAL</td>
                        <td className="px-4 py-3 text-lg text-right text-yellow-400">{formatBRL(data.valorInvestimento)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* Impacto Ambiental */}
                <section>
                  <h2 className="text-lg font-extrabold text-[#1e3a5f] mb-4 pb-2 border-b-2 border-yellow-400">
                    IMPACTO AMBIENTAL
                  </h2>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-3xl mb-2">🌿</div>
                      <div className="text-xl font-extrabold text-green-700">{formatNum(co2Ano, 1)} ton</div>
                      <div className="text-xs text-gray-500 mt-1">CO₂ não emitidos/ano</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-3xl mb-2">🌳</div>
                      <div className="text-xl font-extrabold text-green-700">{arvoresAno.toLocaleString("pt-BR")}</div>
                      <div className="text-xs text-gray-500 mt-1">Árvores salvas/ano</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-3xl mb-2">🚗</div>
                      <div className="text-xl font-extrabold text-green-700">{kmAno.toLocaleString("pt-BR")}</div>
                      <div className="text-xs text-gray-500 mt-1">km não trafegados</div>
                    </div>
                  </div>
                </section>

                {/* Assinatura */}
                <section className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-500 mb-6">
                    Este orçamento é válido até {validade}. {data.cidade || "—"}, {hoje}.
                  </p>
                  <div className="grid grid-cols-2 gap-12 text-center text-sm">
                    <div>
                      <div className="border-t border-gray-400 pt-2 mt-12">
                        <div className="font-bold">{data.nomeEmpresa || "SolarPro"}</div>
                        <div className="text-gray-500">CNPJ: {data.cnpjEmpresa || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-gray-400 pt-2 mt-12">
                        <div className="font-bold">CLIENTE</div>
                        <div className="text-gray-500">{data.nomeCliente || "—"}</div>
                      </div>
                    </div>
                  </div>
                </section>
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
