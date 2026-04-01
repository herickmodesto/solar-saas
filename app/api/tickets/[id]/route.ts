import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/tickets/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const ticket = await prisma.ticket.findFirst({
    where: { id, userId: user.id },
    include: {
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) throw new AuthError("Ticket não encontrado.", 404);

  return Response.json({ ticket });
});

// PATCH /api/tickets/[id]
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const data = await parseBody<{
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title?: string;
    description?: string;
    category?: string;
    assignedTo?: string;
  }>(req);

  const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id } });
  if (!ticket) throw new AuthError("Ticket não encontrado.", 404);

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? {
        status: data.status,
        resolvedAt: (data.status === "RESOLVED" || data.status === "CLOSED") ? new Date() : null,
      } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ ticket: updated });
});

// DELETE /api/tickets/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id } });
  if (!ticket) throw new AuthError("Ticket não encontrado.", 404);

  await prisma.ticket.delete({ where: { id } });
  return Response.json({ success: true });
});
