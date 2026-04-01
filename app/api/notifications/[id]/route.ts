import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, AuthError } from "@/lib/auth";

// PATCH /api/notifications/[id] — marca uma notificação como lida
export const PATCH = withErrorHandler(async (_req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;

  const notif = await prisma.notification.findFirst({ where: { id, userId: user.id } });
  if (!notif) throw new AuthError("Notificação não encontrada.", 404);

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return Response.json({ success: true });
});
