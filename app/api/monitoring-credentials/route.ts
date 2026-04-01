import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, withErrorHandler, parseBody, AuthError } from "@/lib/auth";

type InverterProvider =
  | "GROWATT" | "SOLIS" | "DEYE" | "FRONIUS" | "HUAWEI_FUSIONSOLAR"
  | "WEG" | "ABB" | "SOFAR" | "GOODWE" | "CUSTOM";

// GET /api/monitoring-credentials
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const credentials = await prisma.monitoringCredential.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, provider: true, username: true,
      isActive: true, lastTestAt: true, createdAt: true, updatedAt: true,
      // Nunca retornar password/apiKey/apiSecret em plain text
    },
  });

  return Response.json({ credentials });
});

// POST /api/monitoring-credentials — cria ou atualiza credencial de um provedor
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const data = await parseBody<{
    provider: InverterProvider;
    username?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    serverUrl?: string;
  }>(req);

  if (!data.provider) throw new AuthError("Provider é obrigatório.", 400);

  // Upsert: cada usuário tem no máximo 1 credencial por provedor
  const credential = await prisma.monitoringCredential.upsert({
    where: {
      // Prisma não suporta upsert por campos não-unique compostos, então buscamos primeiro
      id: (await prisma.monitoringCredential.findFirst({
        where: { userId: user.id, provider: data.provider },
        select: { id: true },
      }))?.id ?? "nonexistent",
    },
    update: {
      username: data.username ?? null,
      password: data.password ?? null,
      apiKey: data.apiKey ?? null,
      apiSecret: data.apiSecret ?? null,
      serverUrl: data.serverUrl ?? null,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      provider: data.provider,
      username: data.username ?? null,
      password: data.password ?? null,
      apiKey: data.apiKey ?? null,
      apiSecret: data.apiSecret ?? null,
      serverUrl: data.serverUrl ?? null,
      isActive: true,
    },
    select: {
      id: true, provider: true, username: true,
      isActive: true, lastTestAt: true, createdAt: true,
    },
  });

  return Response.json({ credential }, { status: 201 });
});

// DELETE /api/monitoring-credentials?provider=SOLIS
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as InverterProvider | null;
  if (!provider) throw new AuthError("Provider é obrigatório.", 400);

  const credential = await prisma.monitoringCredential.findFirst({
    where: { userId: user.id, provider },
  });
  if (!credential) throw new AuthError("Credencial não encontrada.", 404);

  await prisma.monitoringCredential.delete({ where: { id: credential.id } });
  return Response.json({ success: true });
});
