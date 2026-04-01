import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

// POST /api/tickets/[id]/messages — adiciona mensagem ao ticket
export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
  const user = await requireAuth();
  const { id } = await ctx.params;
  const data = await parseBody<{ content: string }>(req);

  if (!data.content?.trim()) throw new AuthError("Conteúdo é obrigatório.", 400);

  const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id } });
  if (!ticket) throw new AuthError("Ticket não encontrado.", 404);

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      content: data.content.trim(),
      isStaff: false,
    },
  });

  // Reabrir se estava fechado
  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    await prisma.ticket.update({ where: { id }, data: { status: "IN_PROGRESS", resolvedAt: null } });
  } else {
    await prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  return Response.json({ message }, { status: 201 });
});
