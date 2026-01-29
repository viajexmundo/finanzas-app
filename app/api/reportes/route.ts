import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";

    // Calculate date range
    const now = new Date();
    const from = new Date();
    if (period === "weekly") {
      from.setDate(now.getDate() - 7);
    } else {
      from.setDate(now.getDate() - 30);
    }

    // Fetch all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { bank: true },
    });

    const totalDisponible = accounts
      .filter((a) => a.type !== "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    const totalDeuda = accounts
      .filter((a) => a.type === "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    // Fetch transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: from, lte: now },
      },
      include: {
        fromAccount: { include: { bank: true } },
        toAccount: { include: { bank: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalIngresos = transactions
      .filter((t) => t.type === "INGRESO")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEgresos = transactions
      .filter((t) => t.type === "EGRESO")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransferencias = transactions
      .filter((t) => t.type === "TRANSFERENCIA")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPagosTarjeta = transactions
      .filter((t) => t.type === "PAGO_TARJETA")
      .reduce((sum, t) => sum + t.amount, 0);

    // Credit card details
    const creditCards = accounts
      .filter((a) => a.type === "CREDIT_CARD")
      .map((a) => ({
        id: a.id,
        name: a.name,
        lastFourDigits: a.lastFourDigits,
        bank: a.bank
          ? { name: a.bank.name, shortName: a.bank.shortName, color: a.bank.color, logo: a.bank.logo }
          : null,
        balance: a.balance,
        creditLimit: a.creditLimit || 0,
        usagePercent: a.creditLimit ? Math.round((a.balance / a.creditLimit) * 100) : 0,
        availableCredit: a.creditLimit ? a.creditLimit - a.balance : 0,
        paymentDay: a.paymentDay,
        cutoffDay: a.cutoffDay,
      }));

    // Top categories
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    for (const t of transactions) {
      const cat = t.category || "SIN_CATEGORIA";
      if (!categoryTotals[cat]) categoryTotals[cat] = { total: 0, count: 0 };
      categoryTotals[cat].total += t.amount;
      categoryTotals[cat].count++;
    }
    const totalAmount = Object.values(categoryTotals).reduce((s, c) => s + c.total, 0);
    const topCategories = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percent: totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Chart data - group transactions by day
    const chartMap: Record<string, { disponible: number; deuda: number; ingresos: number; egresos: number }> = {};
    const daysCount = period === "weekly" ? 7 : 30;
    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(now.getDate() - (daysCount - 1 - i));
      const key = d.toISOString().split("T")[0];
      chartMap[key] = { disponible: 0, deuda: 0, ingresos: 0, egresos: 0 };
    }

    // Use balance history to build chart
    const balanceHistory = await prisma.balanceHistory.findMany({
      where: { createdAt: { gte: from, lte: now } },
      include: { account: true },
      orderBy: { createdAt: "asc" },
    });

    // Track running balances per account from history
    // Simpler approach: aggregate daily ingresos/egresos from transactions
    for (const t of transactions) {
      const key = t.date.toISOString().split("T")[0];
      if (chartMap[key]) {
        if (t.type === "INGRESO") chartMap[key].ingresos += t.amount;
        if (t.type === "EGRESO") chartMap[key].egresos += t.amount;
      }
    }

    // Build cumulative chart using current balances and working backwards
    const chartData = Object.entries(chartMap).map(([date, data]) => {
      const d = new Date(date);
      const label =
        period === "weekly"
          ? d.toLocaleDateString("es-GT", { weekday: "short", day: "numeric" })
          : d.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
      return {
        date: label,
        ingresos: Math.round(data.ingresos * 100) / 100,
        egresos: Math.round(data.egresos * 100) / 100,
      };
    });

    // Recent activity stats
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const largestTransaction = transactions.length > 0
      ? transactions.reduce((max, t) => (t.amount > max.amount ? t : max), transactions[0])
      : null;

    // Busiest day
    const dayCount: Record<string, number> = {};
    for (const t of transactions) {
      const dayName = t.date.toLocaleDateString("es-GT", { weekday: "long" });
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    }
    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

    // Transaction type breakdown
    const typeBreakdown = [
      { type: "INGRESO", label: "Ingresos", total: totalIngresos, count: transactions.filter((t) => t.type === "INGRESO").length },
      { type: "EGRESO", label: "Egresos", total: totalEgresos, count: transactions.filter((t) => t.type === "EGRESO").length },
      { type: "TRANSFERENCIA", label: "Transferencias", total: totalTransferencias, count: transactions.filter((t) => t.type === "TRANSFERENCIA").length },
      { type: "PAGO_TARJETA", label: "Pagos Tarjeta", total: totalPagosTarjeta, count: transactions.filter((t) => t.type === "PAGO_TARJETA").length },
    ];

    return NextResponse.json({
      summary: {
        totalDisponible,
        totalDeuda,
        saldoNeto: totalDisponible - totalDeuda,
        totalIngresos,
        totalEgresos,
        flujoNeto: totalIngresos - totalEgresos,
        totalTransferencias,
        totalPagosTarjeta,
        transaccionCount: transactions.length,
      },
      creditCards,
      topCategories,
      typeBreakdown,
      chartData,
      recentActivity: {
        avgDailyIncome: Math.round((totalIngresos / daysDiff) * 100) / 100,
        avgDailyExpense: Math.round((totalEgresos / daysDiff) * 100) / 100,
        largestTransaction: largestTransaction
          ? {
              amount: largestTransaction.amount,
              type: largestTransaction.type,
              description: largestTransaction.description,
              date: largestTransaction.date,
            }
          : null,
        busiestDay: busiestDay ? { day: busiestDay[0], count: busiestDay[1] } : null,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
