import { prisma } from "@/lib/prisma";

export type NotificationType = "ALERT" | "INVOICE" | "TICKET" | "SYSTEM";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link: link ?? null },
  });
}
