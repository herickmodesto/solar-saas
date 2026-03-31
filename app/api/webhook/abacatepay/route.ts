import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Webhook do Abacatepay — atualiza status da assinatura automaticamente.
 * Configure no painel do Abacatepay: POST /api/webhook/abacatepay
 *
 * Eventos tratados:
 *  - billing.paid      → ativa assinatura
 *  - billing.expired   → marca como expirada
 *  - billing.cancelled → cancela assinatura
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // ── Verificação de assinatura HMAC ──────────────────────────────────
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers.get("x-abacatepay-signature") ?? req.headers.get("x-webhook-signature");
      if (!signature) {
        console.warn("[webhook] Assinatura ausente no header.");
        return Response.json({ error: "Assinatura inválida." }, { status: 401 });
      }
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
        console.warn("[webhook] Assinatura inválida.");
        return Response.json({ error: "Assinatura inválida." }, { status: 401 });
      }
    }
    // ────────────────────────────────────────────────────────────────────

    const payload = JSON.parse(rawBody);
    const { event, data } = payload as {
      event: string;
      data: { id: string; status: string };
    };

    const billingId = data?.id;
    if (!billingId) return Response.json({ ok: true });

    const subscription = await prisma.subscription.findFirst({
      where: { abacatepayBillingId: billingId },
    });

    if (!subscription) {
      console.warn("[webhook] Assinatura não encontrada para billingId:", billingId);
      return Response.json({ ok: true });
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    switch (event) {
      case "billing.paid":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
          },
        });
        break;

      case "billing.expired":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "EXPIRED" },
        });
        break;

      case "billing.cancelled":
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELLED" },
        });
        break;

      default:
        console.log("[webhook] Evento ignorado:", event);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[webhook/abacatepay]", err);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}
