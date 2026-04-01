import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler } from "@/lib/auth";

// GET /api/notifications — lista notificações do usuário (últimas 50)
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, type: true, title: true, message: true, link: true, read: true, createdAt: true },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return Response.json({ notifications, unreadCount });
});

// PATCH /api/notifications — marca todas como lidas
export const PATCH = withErrorHandler(async () => {
  const user = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return Response.json({ success: true });
});
