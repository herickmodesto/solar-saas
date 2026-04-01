import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, withErrorHandler } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/plants — list all plants for authenticated user
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireAuth();

  const plants = await prisma.plant.findMany({
    where: { userId: user.id },
    include: {
      client: { select: { id: true, name: true, city: true, state: true } },
      devices: { select: { id: true, serialNumber: true, model: true, brand: true, status: true, currentKw: true } },
      alerts: {
        where: { isResolved: false },
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
      _count: { select: { devices: true, alerts: { where: { isResolved: false } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plants });
});

// POST /api/plants — create new plant
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const body = await parseBody<{
    name: string;
    clientId?: string | null;
    growattPlantId?: string | null;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number | null;
    longitude?: number | null;
    systemKwp?: number | null;
    installDate?: string | null;
  }>(req);

  const plant = await prisma.plant.create({
    data: {
      userId: user.id,
      name: body.name,
      clientId: body.clientId ?? null,
      growattPlantId: body.growattPlantId ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      systemKwp: body.systemKwp ?? null,
      installDate: body.installDate ? new Date(body.installDate) : null,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ plant }, { status: 201 });
});
