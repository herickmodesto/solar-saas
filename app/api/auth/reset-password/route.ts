import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  const { userId, code, password } = await req.json();

  if (!userId || !code || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres." }, { status: 400 });
  }

  const token = await prisma.verificationToken.findFirst({
    where: { userId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!token || !verifyOtp(code, token.code)) {
    return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
  }

  const newHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
