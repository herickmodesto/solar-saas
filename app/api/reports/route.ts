import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody } from "@/lib/auth";

export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const reports = await prisma.monthlyReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      entries: { orderBy: { month: "asc" } },
    },
  });

  return Response.json({ reports });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    clientId?: string; title: string; systemName?: string;
    periodStart: string; periodEnd: string;
    entries: Array<{
      month: string; consumedKwh: number; compensatedKwh: number;
      billValue: number; rentValue: number;
    }>;
  }>(req);

  if (!data.title?.trim()) return Response.json({ error: "Título é obrigatório." }, { status: 400 });

  const report = await prisma.monthlyReport.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      title: data.title,
      systemName: data.systemName,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      entries: {
        create: data.entries.map((e) => ({
          month: new Date(e.month),
          consumedKwh: e.consumedKwh,
          compensatedKwh: e.compensatedKwh,
          billValue: e.billValue,
          rentValue: e.rentValue,
        })),
      },
    },
    include: { entries: true },
  });

  return Response.json({ report }, { status: 201 });
});
