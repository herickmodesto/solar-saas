import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/tickets
export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: user.id,
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  return Response.json({ tickets });
});

// POST /api/tickets
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    title: string;
    description: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    category?: string;
    clientId?: string;
    plantId?: string;
  }>(req);

  if (!data.title?.trim()) throw new AuthError("Título é obrigatório.", 400);
  if (!data.description?.trim()) throw new AuthError("Descrição é obrigatória.", 400);

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority ?? "MEDIUM",
      category: data.category ?? null,
      clientId: data.clientId ?? null,
      plantId: data.plantId ?? null,
      status: "OPEN",
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ ticket }, { status: 201 });
});
