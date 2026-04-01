import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const userId = session.user.id;

  const [proposalCount, calculationCount, clientCount, rentSum, plantCount, alertCount, normalCount] = await Promise.all([
    prisma.proposal.count({ where: { userId } }),
    prisma.calculation.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.calculation.aggregate({ where: { userId }, _sum: { rentValue: true } }),
    prisma.plant.count({ where: { userId } }),
    prisma.plantAlert.count({ where: { plant: { userId }, isResolved: false } }),
    prisma.plant.count({ where: { userId, status: "NORMAL" } }),
  ]);

  const totalKwp = await prisma.plant.aggregate({
    where: { userId, systemKwp: { not: null } },
    _sum: { systemKwp: true },
  });

  return NextResponse.json({
    proposals: proposalCount,
    calculations: calculationCount,
    clients: clientCount,
    totalRent: rentSum._sum.rentValue ?? 0,
    plants: plantCount,
    alerts: alertCount,
    normalPlants: normalCount,
    totalKwp: totalKwp._sum.systemKwp ?? 0,
  });
}
