import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlantStats } from "@/lib/growatt";

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/plants/[id]/monitoring — real-time stats from Growatt
export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;

  const plant = await prisma.plant.findFirst({ where: { id, userId: user.id } });
  if (!plant) throw new AuthError("Usina não encontrada", 404);

  if (!plant.growattPlantId) {
    return NextResponse.json({ monitoring: null, message: "Usina sem ID Growatt vinculado" });
  }

  const stats = await getPlantStats(plant.growattPlantId);

  await prisma.plantDevice.updateMany({
    where: { plantId: id },
    data: { currentKw: stats.currentKw, lastSyncAt: new Date() },
  });

  return NextResponse.json({ monitoring: { plantId: id, ...stats, syncedAt: new Date().toISOString() } });
});
