import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

// GET /api/portal/plants — plants belonging to the logged-in CLIENT user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "CLIENT") {
    return NextResponse.json({ error: "Acesso restrito ao portal do cliente." }, { status: 403 });
  }

  // Find the Client record linked to this portal user
  const client = await prisma.client.findFirst({
    where: { portalUserId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ plants: [], message: "Nenhum cliente vinculado a este usuário." });
  }

  const plants = await prisma.plant.findMany({
    where: { clientId: client.id },
    include: {
      devices: { select: { id: true, serialNumber: true, model: true, brand: true, status: true, currentKw: true } },
      alerts: { where: { isResolved: false }, orderBy: { occurredAt: "desc" }, take: 5 },
      _count: { select: { devices: true, alerts: { where: { isResolved: false } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ plants, clientName: client.name });
}
