import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/invoices — lista faturas do usuário
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const statusFilter = searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.id,
      ...(clientId ? { clientId } : {}),
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    orderBy: { referenceMonth: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      plant: { select: { id: true, name: true } },
    },
  });

  return Response.json({ invoices });
});

// POST /api/invoices — cria nova fatura
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    clientId: string;
    plantId?: string;
    referenceMonth: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }>(req);

  if (!data.clientId) throw new AuthError("clientId é obrigatório.", 400);
  if (!data.referenceMonth) throw new AuthError("referenceMonth é obrigatório.", 400);
  if (!data.amount || data.amount <= 0) throw new AuthError("amount deve ser maior que zero.", 400);
  if (!data.dueDate) throw new AuthError("dueDate é obrigatório.", 400);

  // Verifica que o cliente pertence ao usuário
  const client = await prisma.client.findFirst({ where: { id: data.clientId, userId: user.id } });
  if (!client) throw new AuthError("Cliente não encontrado.", 404);

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      plantId: data.plantId ?? null,
      referenceMonth: new Date(data.referenceMonth),
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      notes: data.notes ?? null,
      status: "PENDING",
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ invoice }, { status: 201 });
});
