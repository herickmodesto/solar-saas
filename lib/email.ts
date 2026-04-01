import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para outros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, name: string, code: string, userId: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/redefinir-senha?userId=${userId}&email=${encodeURIComponent(to)}`;

  await transporter.sendMail({
    from: `"SolarPro" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: "Redefinição de senha — SolarPro",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
                  <span style="font-size:28px;">☀️</span>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">SolarPro</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 8px;color:#1e3a5f;font-size:18px;font-weight:700;">Olá, ${name}!</p>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                    Recebemos uma solicitação para redefinir sua senha. Use o código abaixo ou clique no botão. Expira em <strong>10 minutos</strong>.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:24px;background:#fff7ed;border-radius:12px;">
                      <span style="letter-spacing:16px;font-size:40px;font-weight:800;color:#c2410c;font-family:monospace;">${code}</span>
                    </td></tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr><td align="center">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#1e3a5f;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
                        Redefinir senha
                      </a>
                    </td></tr>
                  </table>
                  <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                    Se você não solicitou a redefinição, ignore este e-mail.<br>
                    Nunca compartilhe este código com ninguém.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} SolarPro. Todos os direitos reservados.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendOtpEmail(to: string, name: string, code: string) {
  await transporter.sendMail({
    from: `"SolarPro" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: "Seu código de verificação — SolarPro",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
                  <span style="font-size:28px;">☀️</span>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">SolarPro</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 8px;color:#1e3a5f;font-size:18px;font-weight:700;">Olá, ${name}!</p>
                  <p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.6;">
                    Use o código abaixo para verificar seu e-mail. Ele expira em <strong>10 minutos</strong>.
                  </p>

                  <!-- OTP Code -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:24px;background:#f0f7ff;border-radius:12px;">
                      <span style="letter-spacing:16px;font-size:40px;font-weight:800;color:#1e3a5f;font-family:monospace;">${code}</span>
                    </td></tr>
                  </table>

                  <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                    Se você não criou uma conta no SolarPro, ignore este e-mail.<br>
                    Nunca compartilhe este código com ninguém.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} SolarPro. Todos os direitos reservados.</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
