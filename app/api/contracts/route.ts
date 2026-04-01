import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/contracts
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const statusFilter = searchParams.get("status");

  const contracts = await prisma.contract.findMany({
    where: {
      userId: user.id,
      ...(clientId ? { clientId } : {}),
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ contracts });
});

// POST /api/contracts
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    clientId: string;
    plantId?: string;
    title: string;
    startDate: string;
    endDate?: string;
    monthlyAmount: number;
    adjustmentIndex?: string;
    notes?: string;
  }>(req);

  if (!data.clientId) throw new AuthError("clientId é obrigatório.", 400);
  if (!data.title?.trim()) throw new AuthError("Título é obrigatório.", 400);
  if (!data.startDate) throw new AuthError("Data de início é obrigatória.", 400);
  if (!data.monthlyAmount || data.monthlyAmount <= 0) throw new AuthError("Valor mensal deve ser maior que zero.", 400);

  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: user.id } });
  if (!client) throw new AuthError("Cliente não encontrado.", 404);

  const contract = await prisma.contract.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      plantId: data.plantId ?? null,
      title: data.title.trim(),
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      monthlyAmount: data.monthlyAmount,
      adjustmentIndex: data.adjustmentIndex ?? null,
      status: "ACTIVE",
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ contract }, { status: 201 });
});
