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

  const [proposalCount, calculationCount, clientCount, rentSum] = await Promise.all([
    prisma.proposal.count({ where: { userId } }),
    prisma.calculation.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.calculation.aggregate({ where: { userId }, _sum: { rentValue: true } }),
  ]);

  return NextResponse.json({
    proposals: proposalCount,
    calculations: calculationCount,
    clients: clientCount,
    totalRent: rentSum._sum.rentValue ?? 0,
  });
}
