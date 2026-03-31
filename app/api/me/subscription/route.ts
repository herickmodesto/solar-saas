import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!sub) {
    return NextResponse.json({ plan: "Free Plan", status: "Gratuito", rawStatus: "FREE", endsAt: null });
  }

  const planLabels: Record<string, string> = {
    PROPOSTA: "Plano Proposta",
    PRO: "Plano Pro",
    ENTERPRISE: "Plano Enterprise",
  };

  const statusLabels: Record<string, string> = {
    TRIAL: "Trial",
    ACTIVE: "Ativo",
    PAST_DUE: "Vencido",
    CANCELLED: "Cancelado",
    EXPIRED: "Expirado",
  };

  const endDate = sub.currentPeriodEnd ?? sub.trialEndsAt;

  return NextResponse.json({
    plan: planLabels[sub.plan] ?? sub.plan,
    status: statusLabels[sub.status] ?? sub.status,
    rawStatus: sub.status,
    endsAt: endDate ? endDate.toISOString() : null,
  });
}
