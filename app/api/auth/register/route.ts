import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, companyName, companyCnpj, phone } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return Response.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const otpCode = generateOtp();

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        companyName,
        companyCnpj,
        phone,
        emailVerified: false,
        // Token OTP — expira em 10 min
        verificationTokens: {
          create: {
            code: hashOtp(otpCode),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        },
      },
      select: { id: true, name: true, email: true },
    });

    // Envia OTP por email (não bloqueia a resposta se falhar)
    sendOtpEmail(user.email, user.name, otpCode).catch((err) =>
      console.error("[register] Falha ao enviar OTP:", err)
    );

    return Response.json(
      {
        user,
        redirectTo: `/verify-email?userId=${user.id}&email=${encodeURIComponent(user.email)}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return Response.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
