import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireAuth();

  const since = new Date();
  since.setDate(since.getDate() - 365);

  const plants = await prisma.plant.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
      systemKwp: true,
      lastSyncAt: true,
      inverterProvider: true,
      energyLogs: {
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
        select: { date: true, todayKwh: true, monthKwh: true, currentKw: true },
      },
      _count: { select: { alerts: { where: { isResolved: false } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ plants });
});
