import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedProposal(userId: string, id: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id, userId },
    include: { client: true },
  });
  if (!proposal) throw new AuthError("Proposta não encontrada.", 404);
  return proposal;
}

// GET /api/proposals/:id
export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  const proposal = await getOwnedProposal(user.id, id);
  return Response.json({ proposal });
});

// PATCH /api/proposals/:id — atualiza status ou dados
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getOwnedProposal(user.id, id);

  const data = await parseBody<{
    status?: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    pdfUrl?: string;
    notes?: string;
  }>(req);

  const proposal = await prisma.proposal.update({ where: { id }, data });
  return Response.json({ proposal });
});

// DELETE /api/proposals/:id
export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getOwnedProposal(user.id, id);
  await prisma.proposal.delete({ where: { id } });
  return Response.json({ success: true });
});
