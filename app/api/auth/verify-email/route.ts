import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return Response.json({ error: "userId e code são obrigatórios." }, { status: 400 });
    }

    // Busca o token mais recente não utilizado
    const token = await prisma.verificationToken.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return Response.json({ error: "Código inválido ou expirado. Solicite um novo." }, { status: 400 });
    }

    if (!verifyOtp(code.trim(), token.code)) {
      return Response.json({ error: "Código incorreto." }, { status: 400 });
    }

    // Marca token como usado e verifica email do usuário
    await prisma.$transaction([
      prisma.verificationToken.update({ where: { id: token.id }, data: { used: true } }),
      prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
    ]);

    return Response.json({ success: true, message: "E-mail verificado com sucesso!" });
  } catch (err) {
    console.error("[verify-email]", err);
    return Response.json({ error: "Erro ao verificar código." }, { status: 500 });
  }
}
