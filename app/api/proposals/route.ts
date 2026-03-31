import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody } from "@/lib/auth";

// GET /api/proposals
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const proposals = await prisma.proposal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true, city: true, state: true } } },
  });

  return Response.json({ proposals });
});

// POST /api/proposals
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    clientId: string;
    numModules: number; modulePower: number; systemKwp: number;
    monthlyGenKwh: number; requiredAreaM2?: number;
    investmentValue: number; monthlyConsumptionKwh: number;
    currentEnergyCost: number; tariffDiscount: number; inflationRate: number;
    monthlyEconomy: number; paybackMonths: number; savings25y: number;
    modulesBrand?: string; modulesModel?: string;
    inverterBrand?: string; inverterModel?: string; inverterQuantity?: number;
    co2TonsAvoided?: number; treesSaved?: number; kmEquivalent?: number;
    notes?: string;
  }>(req);

  if (!data.clientId) {
    return Response.json({ error: "clientId é obrigatório." }, { status: 400 });
  }

  // Verifica que o cliente pertence ao usuário
  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: user.id } });
  if (!client) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });

  // Gera número sequencial de proposta
  const count = await prisma.proposal.count({ where: { userId: user.id } });
  const proposalNumber = `SP-${String(count + 1).padStart(4, "0")}-${new Date().getFullYear()}`;

  const proposal = await prisma.proposal.create({
    data: {
      ...data,
      userId: user.id,
      proposalNumber,
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 dias
    },
    include: { client: { select: { name: true } } },
  });

  return Response.json({ proposal }, { status: 201 });
});
