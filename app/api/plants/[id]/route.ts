import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, withErrorHandler, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<Record<string, string>> };

async function getPlantOrThrow(userId: string, id: string) {
  const plant = await prisma.plant.findFirst({ where: { id, userId } });
  if (!plant) throw new AuthError("Usina não encontrada", 404);
  return plant;
}

// GET /api/plants/[id]
export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  const plant = await prisma.plant.findFirst({
    where: { id, userId: user.id },
    include: {
      client: { select: { id: true, name: true, city: true, state: true, email: true, phone: true } },
      devices: true,
      alerts: { orderBy: { occurredAt: "desc" }, take: 20 },
    },
  });
  if (!plant) throw new AuthError("Usina não encontrada", 404);
  return NextResponse.json({ plant });
});

// PATCH /api/plants/[id]
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getPlantOrThrow(user.id, id);

  const body = await parseBody<{
    name?: string;
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

  const plant = await prisma.plant.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
      ...(body.growattPlantId !== undefined && { growattPlantId: body.growattPlantId }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.latitude !== undefined && { latitude: body.latitude }),
      ...(body.longitude !== undefined && { longitude: body.longitude }),
      ...(body.systemKwp !== undefined && { systemKwp: body.systemKwp }),
      ...(body.installDate !== undefined && { installDate: body.installDate ? new Date(body.installDate) : null }),
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ plant });
});

// DELETE /api/plants/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getPlantOrThrow(user.id, id);
  await prisma.plant.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
