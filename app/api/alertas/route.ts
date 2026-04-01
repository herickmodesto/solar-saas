import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved");

  const alerts = await prisma.plantAlert.findMany({
    where: {
      plant: { userId: user.id },
      ...(resolved === "true" ? { isResolved: true } : resolved === "false" ? { isResolved: false } : {}),
    },
    include: {
      plant: { select: { id: true, name: true, city: true } },
    },
    orderBy: [{ isResolved: "asc" }, { occurredAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ alerts });
});
