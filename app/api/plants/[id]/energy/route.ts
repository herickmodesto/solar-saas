import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlantStats } from "@/lib/growatt";

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/plants/[id]/energy?type=day|month|year
export const GET = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "day") as "day" | "month" | "year";

  const plant = await prisma.plant.findFirst({ where: { id, userId: user.id } });
  if (!plant) throw new AuthError("Usina não encontrada", 404);

  if (!plant.growattPlantId) {
    return NextResponse.json({ energy: null, message: "Usina sem ID Growatt vinculado" });
  }

  const stats = await getPlantStats(plant.growattPlantId);

  const value =
    type === "day" ? stats.todayKwh
    : type === "month" ? stats.monthKwh
    : stats.yearKwh;

  return NextResponse.json({
    energy: {
      type,
      value,
      unit: "kWh",
      currentKw: stats.currentKw,
      totalKwh: stats.totalKwh,
    },
  });
});
