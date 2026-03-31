import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody } from "@/lib/auth";

// GET /api/calculations
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const calculations = await prisma.calculation.findMany({
    where: { userId: user.id },
    orderBy: { referenceMonth: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  return Response.json({ calculations });
});

// POST /api/calculations
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    clientId?: string;
    teRate: number; tusdRate: number; tusdFioBRate: number;
    pisRate: number; cofinsRate: number; icmsRate: number;
    referenceMonth: string; // ISO date string
    consumedKwh: number; compensatedKwh: number;
    tariffDiscount: number; gdTaxYear: number;
    costWithout: number; costWith: number; rentValue: number; savings: number;
    co2Avoided?: number; treesSaved?: number;
  }>(req);

  if (data.clientId) {
    const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: user.id } });
    if (!client) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const calculation = await prisma.calculation.create({
    data: {
      ...data,
      userId: user.id,
      referenceMonth: new Date(data.referenceMonth),
    },
  });

  return Response.json({ calculation }, { status: 201 });
});
