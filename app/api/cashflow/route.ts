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
    const days = parseInt(searchParams.get("days") || "30");

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + days);

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { bank: true },
    });

    // Get historical transactions for pattern analysis (last 90 days)
    const historyStart = new Date();
    historyStart.setDate(now.getDate() - 90);

    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: historyStart, lte: now },
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: "desc" },
    });

    // Calculate current totals
    const totalDisponible = accounts
      .filter((a) => a.type !== "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    const totalDeuda = accounts
      .filter((a) => a.type === "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    // Build projected cash flow
    const projectedEvents: {
      date: string;
      type: "ingreso" | "egreso" | "pago_tarjeta";
      amount: number;
      description: string;
      source: "proyectado" | "recurrente" | "tarjeta";
      confidence: "alta" | "media" | "baja";
    }[] = [];

    // 1. Credit card payments due
    const creditCards = accounts.filter((a) => a.type === "CREDIT_CARD" && a.paymentDay);
    for (const card of creditCards) {
      if (!card.paymentDay) continue;

      // Find payment dates in the projection window
      for (let monthOffset = 0; monthOffset <= Math.ceil(days / 30); monthOffset++) {
        const paymentDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, card.paymentDay);

        if (paymentDate > now && paymentDate <= endDate) {
          projectedEvents.push({
            date: paymentDate.toISOString().split("T")[0],
            type: "pago_tarjeta",
            amount: card.balance,
            description: `Pago ${card.name}${card.bank ? ` (${card.bank.shortName || card.bank.name})` : ""}`,
            source: "tarjeta",
            confidence: "alta",
          });
        }
      }
    }

    // 2. Analyze recurring patterns from history
    // Group transactions by description and find monthly patterns
    const descriptionPatterns: Record<string, { amounts: number[]; dates: number[]; type: string }> = {};

    for (const t of historicalTransactions) {
      if (!t.description) continue;
      const key = t.description.toLowerCase().trim();
      if (!descriptionPatterns[key]) {
        descriptionPatterns[key] = { amounts: [], dates: [], type: t.type };
      }
      descriptionPatterns[key].amounts.push(t.amount);
      descriptionPatterns[key].dates.push(new Date(t.date).getDate());
    }

    // Find patterns that appear at least 2 times with similar amounts
    for (const [description, pattern] of Object.entries(descriptionPatterns)) {
      if (pattern.amounts.length < 2) continue;

      const avgAmount = pattern.amounts.reduce((a, b) => a + b, 0) / pattern.amounts.length;
      const variance = pattern.amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / pattern.amounts.length;
      const stdDev = Math.sqrt(variance);

      // Low variance means consistent amounts (likely recurring)
      if (stdDev / avgAmount < 0.2) {
        const avgDay = Math.round(pattern.dates.reduce((a, b) => a + b, 0) / pattern.dates.length);

        // Project next occurrence
        for (let monthOffset = 0; monthOffset <= Math.ceil(days / 30); monthOffset++) {
          const projectedDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, avgDay);

          if (projectedDate > now && projectedDate <= endDate) {
            projectedEvents.push({
              date: projectedDate.toISOString().split("T")[0],
              type: pattern.type === "INGRESO" ? "ingreso" : "egreso",
              amount: Math.round(avgAmount * 100) / 100,
              description: description.charAt(0).toUpperCase() + description.slice(1),
              source: "recurrente",
              confidence: pattern.amounts.length >= 3 ? "alta" : "media",
            });
            break; // Only project next occurrence
          }
        }
      }
    }

    // 3. Calculate average daily income/expense for general projection
    const totalIngresos = historicalTransactions
      .filter((t) => t.type === "INGRESO")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEgresos = historicalTransactions
      .filter((t) => t.type === "EGRESO")
      .reduce((sum, t) => sum + t.amount, 0);

    const avgDailyIncome = totalIngresos / 90;
    const avgDailyExpense = totalEgresos / 90;

    // Sort events by date
    projectedEvents.sort((a, b) => a.date.localeCompare(b.date));

    // Build daily projection with running balance
    const dailyProjection: {
      date: string;
      label: string;
      saldoProyectado: number;
      ingresos: number;
      egresos: number;
      events: typeof projectedEvents;
    }[] = [];

    let runningBalance = totalDisponible;
    const currentDate = new Date(now);

    for (let i = 0; i < days; i++) {
      currentDate.setDate(now.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayEvents = projectedEvents.filter((e) => e.date === dateStr);

      let dayIngresos = 0;
      let dayEgresos = 0;

      for (const event of dayEvents) {
        if (event.type === "ingreso") {
          dayIngresos += event.amount;
          runningBalance += event.amount;
        } else {
          dayEgresos += event.amount;
          runningBalance -= event.amount;
        }
      }

      // Add average baseline (only if no specific events)
      if (dayEvents.length === 0) {
        dayIngresos = Math.round(avgDailyIncome * 100) / 100;
        dayEgresos = Math.round(avgDailyExpense * 100) / 100;
        runningBalance += dayIngresos - dayEgresos;
      }

      dailyProjection.push({
        date: dateStr,
        label: currentDate.toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short" }),
        saldoProyectado: Math.round(runningBalance * 100) / 100,
        ingresos: dayIngresos,
        egresos: dayEgresos,
        events: dayEvents,
      });
    }

    // Calculate summary metrics
    const totalIngresosProyectados = projectedEvents
      .filter((e) => e.type === "ingreso")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalEgresosProyectados = projectedEvents
      .filter((e) => e.type !== "ingreso")
      .reduce((sum, e) => sum + e.amount, 0);

    const saldoFinalProyectado = dailyProjection[dailyProjection.length - 1]?.saldoProyectado || totalDisponible;

    // Find lowest point
    const lowestPoint = dailyProjection.reduce((min, day) =>
      day.saldoProyectado < min.saldoProyectado ? day : min
    , dailyProjection[0]);

    return NextResponse.json({
      currentBalance: totalDisponible,
      currentDebt: totalDeuda,
      projectedEndBalance: saldoFinalProyectado,
      projectedIncome: totalIngresosProyectados + (avgDailyIncome * days),
      projectedExpenses: totalEgresosProyectados + (avgDailyExpense * days),
      lowestPoint: {
        date: lowestPoint?.date,
        label: lowestPoint?.label,
        balance: lowestPoint?.saldoProyectado,
      },
      avgDailyIncome: Math.round(avgDailyIncome * 100) / 100,
      avgDailyExpense: Math.round(avgDailyExpense * 100) / 100,
      upcomingEvents: projectedEvents.slice(0, 10),
      dailyProjection: dailyProjection.filter((_, i) => i % (days > 30 ? 7 : 1) === 0 || i === dailyProjection.length - 1),
      creditCardPayments: creditCards.map((c) => ({
        id: c.id,
        name: c.name,
        bank: c.bank ? { name: c.bank.name, shortName: c.bank.shortName, color: c.bank.color } : null,
        balance: c.balance,
        paymentDay: c.paymentDay,
        cutoffDay: c.cutoffDay,
      })),
    });
  } catch (error) {
    console.error("Error generating cash flow projection:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
