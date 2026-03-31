import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedClient(userId: string, id: string) {
  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) throw new AuthError("Cliente não encontrado.", 404);
  return client;
}

// GET /api/clients/:id
export const GET = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  const client = await getOwnedClient(user.id, id);
  return Response.json({ client });
});

// PATCH /api/clients/:id
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getOwnedClient(user.id, id);

  const data = await parseBody<Partial<{
    name: string; email: string; cpf: string; phone: string;
    address: string; city: string; state: string; zipCode: string;
    companyName: string; companyCnpj: string; companyContact: string; notes: string;
  }>>(req);

  const client = await prisma.client.update({ where: { id }, data });
  return Response.json({ client });
});

// DELETE /api/clients/:id
export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireAuth();
  const { id } = await params;
  await getOwnedClient(user.id, id);
  await prisma.client.delete({ where: { id } });
  return Response.json({ success: true });
});
