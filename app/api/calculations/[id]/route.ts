import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function getOwned(userId: string, id: string) {
  const calc = await prisma.calculation.findFirst({ where: { id, userId } });
  if (!calc) throw new AuthError("Cálculo não encontrado.", 404);
  return calc;
}

export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  const calculation = await getOwned(user.id, id);
  return Response.json({ calculation });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getOwned(user.id, id);
  await prisma.calculation.delete({ where: { id } });
  return Response.json({ success: true });
});
