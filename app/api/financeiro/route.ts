import { requireAuth, withErrorHandler } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro — resumo financeiro dos últimos 12 meses
export const GET = withErrorHandler(async () => {
  const user = await requireAuth();

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Todas as faturas do usuário
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    select: {
      amount: true, status: true, paidAt: true,
      referenceMonth: true, dueDate: true,
    },
  });

  // Contratos ativos
  const activeContracts = await prisma.contract.count({
    where: { userId: user.id, status: "ACTIVE" },
  });
  const totalMonthlyRevenue = await prisma.contract.aggregate({
    where: { userId: user.id, status: "ACTIVE" },
    _sum: { monthlyAmount: true },
  });

  // Receita por mês (últimos 12 meses)
  const monthlyRevenue: Record<string, { paid: number; pending: number; overdue: number }> = {};

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[key] = { paid: 0, pending: 0, overdue: 0 };
  }

  invoices.forEach((inv) => {
    const d = new Date(inv.referenceMonth);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!(key in monthlyRevenue)) return;

    if (inv.status === "PAID") monthlyRevenue[key].paid += inv.amount;
    else if (inv.status === "PENDING" || inv.status === "SENT") monthlyRevenue[key].pending += inv.amount;
    else if (inv.status === "OVERDUE") monthlyRevenue[key].overdue += inv.amount;
  });

  const revenueChart = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      ...data,
    }));

  // Totais gerais
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => ["PENDING", "SENT"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.amount, 0);

  return Response.json({
    summary: {
      totalPaid,
      totalPending,
      totalOverdue,
      activeContracts,
      contractMonthlyRevenue: totalMonthlyRevenue._sum.monthlyAmount ?? 0,
      invoiceCount: invoices.length,
    },
    revenueChart,
  });
});
