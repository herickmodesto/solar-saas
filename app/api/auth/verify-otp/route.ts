import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

/**
 * Verifica se o OTP está correto SEM consumi-lo.
 * Usado no fluxo de redefinição de senha para validar o código antes de pedir a nova senha.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return Response.json({ error: "userId e code são obrigatórios." }, { status: 400 });
    }

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

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return Response.json({ error: "Erro ao verificar código." }, { status: 500 });
  }
}
