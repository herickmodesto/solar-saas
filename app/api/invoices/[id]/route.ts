import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/invoices/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      plant: { select: { id: true, name: true } },
    },
  });
  if (!invoice) throw new AuthError("Fatura não encontrada.", 404);

  return Response.json({ invoice });
});

// PATCH /api/invoices/[id] — atualiza status ou dados
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const data = await parseBody<{
    status?: "PENDING" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
    paidAt?: string;
    notes?: string;
    amount?: number;
    dueDate?: string;
  }>(req);

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id } });
  if (!invoice) throw new AuthError("Fatura não encontrada.", 404);

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.paidAt !== undefined ? { paidAt: new Date(data.paidAt) } : {}),
      ...(data.status === "PAID" && !data.paidAt ? { paidAt: new Date() } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ invoice: updated });
});

// DELETE /api/invoices/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.id } });
  if (!invoice) throw new AuthError("Fatura não encontrada.", 404);

  await prisma.invoice.delete({ where: { id } });
  return Response.json({ success: true });
});
