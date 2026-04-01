import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<Record<string, string>> };

export const PATCH = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;

  const alert = await prisma.plantAlert.findFirst({
    where: { id },
    include: { plant: { select: { userId: true } } },
  });

  if (!alert || alert.plant.userId !== user.id) throw new AuthError("Alerta não encontrado", 404);

  const updated = await prisma.plantAlert.update({
    where: { id },
    data: { isResolved: true, resolvedAt: new Date() },
  });

  return NextResponse.json({ alert: updated });
});
