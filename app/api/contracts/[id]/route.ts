import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// GET /api/contracts/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const contract = await prisma.contract.findFirst({
    where: { id, userId: user.id },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  if (!contract) throw new AuthError("Contrato não encontrado.", 404);

  return Response.json({ contract });
});

// PATCH /api/contracts/[id]
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const data = await parseBody<{
    status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_SIGNATURE";
    title?: string;
    monthlyAmount?: number;
    endDate?: string;
    adjustmentIndex?: string;
    signedAt?: string;
    pdfUrl?: string;
  }>(req);

  const contract = await prisma.contract.findFirst({ where: { id, userId: user.id } });
  if (!contract) throw new AuthError("Contrato não encontrado.", 404);

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.monthlyAmount !== undefined ? { monthlyAmount: data.monthlyAmount } : {}),
      ...(data.endDate !== undefined ? { endDate: new Date(data.endDate) } : {}),
      ...(data.adjustmentIndex !== undefined ? { adjustmentIndex: data.adjustmentIndex } : {}),
      ...(data.signedAt !== undefined ? { signedAt: new Date(data.signedAt) } : {}),
      ...(data.pdfUrl !== undefined ? { pdfUrl: data.pdfUrl } : {}),
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return Response.json({ contract: updated });
});

// DELETE /api/contracts/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const contract = await prisma.contract.findFirst({ where: { id, userId: user.id } });
  if (!contract) throw new AuthError("Contrato não encontrado.", 404);

  await prisma.contract.delete({ where: { id } });
  return Response.json({ success: true });
});
