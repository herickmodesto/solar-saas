import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Sempre retorna sucesso para não revelar se o e-mail existe
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  if (user.provider !== "credentials") {
    return NextResponse.json(
      { error: "Esta conta usa login via Google. Redefina a senha pelo Google." },
      { status: 400 }
    );
  }

  // Invalida tokens anteriores
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const code = generateOtp();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      code: hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail(user.email, user.name, code);

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
  });
}
