import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Simple in-memory lock to prevent concurrent generation
const generationLocks = new Map<string, number>();
const LOCK_DURATION = 10000; // 10 seconds

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = Date.now();

    // Check if there's an active lock for this user
    const lastGeneration = generationLocks.get(userId);
    if (lastGeneration && now - lastGeneration < LOCK_DURATION) {
      return NextResponse.json({
        success: true,
        alertsCreated: [],
        message: "Generación en proceso, saltando...",
        skipped: true,
      });
    }

    // Set lock
    generationLocks.set(userId, now);

    const alertsCreated: string[] = [];

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { bank: true },
    });

    // Get settings for thresholds
    const settings = await prisma.settings.findFirst();
    const alertDaysBefore = settings?.alertDaysBefore || 3;
    const highUsageThreshold = settings?.highUsageThreshold || 80;
    const lowBalanceThreshold = 1000; // Default Q1000

    const nowDate = new Date();
    const oneDayAgo = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);

    // Get ALL alerts (including dismissed) from the last 24 hours to avoid re-creating
    const recentAlerts = await prisma.alert.findMany({
      where: {
        userId,
        createdAt: { gte: oneDayAgo },
      },
    });

    // Helper to check if similar alert was created recently (active OR dismissed)
    const alertExistsRecently = (type: string, accountId?: string) => {
      return recentAlerts.some(alert => {
        if (alert.type !== type) return false;
        if (!accountId) return true; // For alerts without specific account
        try {
          const data = JSON.parse(alert.data || "{}");
          return data.accountId === accountId;
        } catch {
          return false;
        }
      });
    };

    // 1. Check credit card payment dates
    const creditCards = accounts.filter(a => a.type === "CREDIT_CARD" && a.paymentDay);
    for (const card of creditCards) {
      if (!card.paymentDay || card.balance <= 0) continue;

      // Calculate next payment date
      let paymentDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), card.paymentDay);
      if (paymentDate < nowDate) {
        paymentDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, card.paymentDay);
      }

      const daysUntilPayment = Math.ceil((paymentDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilPayment <= alertDaysBefore && daysUntilPayment >= 0) {
        if (!alertExistsRecently("PAYMENT_DUE", card.id)) {
          await prisma.alert.create({
            data: {
              userId,
              type: "PAYMENT_DUE",
              message: `Pago de ${card.name}${card.bank ? ` (${card.bank.shortName || card.bank.name})` : ""} vence en ${daysUntilPayment} día${daysUntilPayment !== 1 ? "s" : ""} - Q${card.balance.toLocaleString()}`,
              data: JSON.stringify({ accountId: card.id, daysUntil: daysUntilPayment, amount: card.balance }),
            },
          });
          alertsCreated.push(`PAYMENT_DUE: ${card.name}`);
        }
      }
    }

    // 2. Check high credit card usage
    for (const card of creditCards) {
      if (!card.creditLimit || card.creditLimit <= 0) continue;

      const usagePercent = (card.balance / card.creditLimit) * 100;

      if (usagePercent >= highUsageThreshold) {
        if (!alertExistsRecently("HIGH_USAGE", card.id)) {
          await prisma.alert.create({
            data: {
              userId,
              type: "HIGH_USAGE",
              message: `${card.name}${card.bank ? ` (${card.bank.shortName || card.bank.name})` : ""} al ${Math.round(usagePercent)}% de su límite`,
              data: JSON.stringify({ accountId: card.id, usage: Math.round(usagePercent), limit: card.creditLimit }),
            },
          });
          alertsCreated.push(`HIGH_USAGE: ${card.name}`);
        }
      }
    }

    // 3. Check low balance accounts
    const bankAccounts = accounts.filter(a => a.type === "BANK" || a.type === "CASH");
    for (const account of bankAccounts) {
      if (account.balance < lowBalanceThreshold && account.balance >= 0) {
        if (!alertExistsRecently("LOW_BALANCE", account.id)) {
          await prisma.alert.create({
            data: {
              userId,
              type: "LOW_BALANCE",
              message: `${account.name} tiene saldo bajo (Q${account.balance.toLocaleString()})`,
              data: JSON.stringify({ accountId: account.id, balance: account.balance }),
            },
          });
          alertsCreated.push(`LOW_BALANCE: ${account.name}`);
        }
      }
    }

    // 4. Check excess debt ratio
    const totalDisponible = accounts
      .filter(a => a.type !== "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    const totalDeuda = accounts
      .filter(a => a.type === "CREDIT_CARD")
      .reduce((sum, a) => sum + a.balance, 0);

    if (totalDisponible > 0) {
      const debtRatio = (totalDeuda / totalDisponible) * 100;

      if (debtRatio >= 30) {
        if (!alertExistsRecently("EXCESS_DEBT")) {
          await prisma.alert.create({
            data: {
              userId,
              type: "EXCESS_DEBT",
              message: `Deuda total (Q${totalDeuda.toLocaleString()}) representa el ${Math.round(debtRatio)}% del disponible`,
              data: JSON.stringify({ percentage: Math.round(debtRatio), debt: totalDeuda, available: totalDisponible }),
            },
          });
          alertsCreated.push(`EXCESS_DEBT: ${Math.round(debtRatio)}%`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      alertsCreated,
      message: alertsCreated.length > 0
        ? `Se crearon ${alertsCreated.length} alerta(s)`
        : "No hay nuevas alertas",
    });
  } catch (error) {
    console.error("Error generating alerts:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
