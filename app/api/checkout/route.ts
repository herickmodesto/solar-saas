import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

const ABACATEPAY_API = "https://api.abacatepay.com/v1";

const PLAN_CONFIG: Record<string, { type: "PROPOSTA" | "PRO" | "ENTERPRISE"; price: number }> = {
  Proposta:   { type: "PROPOSTA",   price: 97 },
  Pro:        { type: "PRO",        price: 197 },
  Enterprise: { type: "ENTERPRISE", price: 497 },
};

interface CheckoutBody {
  planName: string;   // "Proposta" | "Pro" | "Enterprise"
  method?: "PIX" | "CREDIT";
  customerCellphone?: string;
  customerTaxId?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login antes de assinar um plano." }, { status: 401 });
  }

  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key não configurada." }, { status: 500 });
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { planName, method, customerCellphone, customerTaxId } = body;

  if (!planName) {
    return NextResponse.json({ error: "Campo obrigatório: planName." }, { status: 400 });
  }

  const plan = PLAN_CONFIG[planName];
  if (!plan) {
    return NextResponse.json({ error: `Plano inválido: ${planName}` }, { status: 400 });
  }
  const { type: planType, price: planPrice } = plan;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const payload = {
    frequency: "ONE_TIME",
    methods: [method ?? "PIX"],
    products: [
      {
        externalId: `solarpro-${planName.toLowerCase()}`,
        name: `SolarPro — Plano ${planName}`,
        description: `Assinatura mensal do plano ${planName}`,
        quantity: 1,
        price: Math.round(planPrice * 100), // centavos
      },
    ],
    returnUrl: `${baseUrl}/dashboard`,
    completionUrl: `${baseUrl}/dashboard`,
    customer: {
      name: session.user.name,
      email: session.user.email,
      ...(customerCellphone ? { cellphone: customerCellphone } : {}),
      ...(customerTaxId ? { taxId: customerTaxId } : {}),
    },
  };

  const response = await fetch(`${ABACATEPAY_API}/billing/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Abacatepay] Erro:", data);
    return NextResponse.json(
      { error: data?.message ?? "Erro ao criar cobrança." },
      { status: response.status }
    );
  }

  const billingId: string = data?.data?.id ?? data?.id;
  const checkoutUrl: string = data?.data?.url ?? data?.url;

  if (!checkoutUrl) {
    return NextResponse.json({ error: "URL de checkout não retornada." }, { status: 502 });
  }

  // Salva o billingId e o plano escolhido na assinatura do usuário (upsert — cria se não existir)
  if (billingId) {
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { plan: planType, abacatepayBillingId: billingId },
      create: {
        userId: session.user.id,
        plan: planType,
        status: "TRIAL",
        abacatepayBillingId: billingId,
      },
    });
  }

  return NextResponse.json({ url: checkoutUrl });
}
