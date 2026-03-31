import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (user.emailVerified) return Response.json({ error: "E-mail já verificado." }, { status: 400 });

    // Rate limit: impede reenvio antes do cooldown
    const lastToken = await prisma.verificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (lastToken) {
      const elapsed = (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return Response.json(
          { error: `Aguarde ${wait}s antes de reenviar.` },
          { status: 429 }
        );
      }
    }

    const code = generateOtp();

    await prisma.verificationToken.create({
      data: {
        userId,
        code: hashOtp(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    await sendOtpEmail(user.email, user.name, code);

    return Response.json({ success: true, message: "Código reenviado para seu e-mail." });
  } catch (err) {
    console.error("[resend-otp]", err);
    return Response.json({ error: "Erro ao reenviar código." }, { status: 500 });
  }
}
