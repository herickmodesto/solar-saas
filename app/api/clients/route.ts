import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody } from "@/lib/auth";

// GET /api/clients — lista clientes do usuário autenticado
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true,
      city: true, state: true, companyName: true, createdAt: true,
      _count: { select: { proposals: true, calculations: true } },
    },
  });

  return Response.json({ clients });
});

// POST /api/clients — cria novo cliente
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    name: string; email?: string; cpf?: string; phone?: string;
    address?: string; city?: string; state?: string; zipCode?: string;
    companyName?: string; companyCnpj?: string; companyContact?: string; notes?: string;
  }>(req);

  if (!data.name?.trim()) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: { ...data, userId: user.id },
  });

  return Response.json({ client }, { status: 201 });
});
