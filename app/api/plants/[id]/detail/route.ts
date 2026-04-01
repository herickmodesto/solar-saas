import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/plants/[id]/detail — full plant data for detail page
export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;

  const plant = await prisma.plant.findFirst({
    where: { id, userId: user.id },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true, city: true, state: true } },
      devices: { orderBy: { createdAt: "asc" } },
      alerts: { orderBy: { occurredAt: "desc" }, take: 50 },
      energyLogs: {
        orderBy: { date: "asc" },
        take: 90, // últimos 90 dias
      },
      _count: { select: { devices: true, alerts: { where: { isResolved: false } } } },
    },
  });

  if (!plant) throw new AuthError("Usina não encontrada", 404);

  return NextResponse.json({ plant });
});
