import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { bank: true },
    });

    // Calculate totals
    const exchangeRateRecord = await prisma.exchangeRate.findFirst({
      where: { fromCurrency: "USD", toCurrency: "GTQ" },
    });
    const exchangeRate = exchangeRateRecord?.rate || 7.85;

    let totalAvailable = 0;
    let totalDebt = 0;

    const accountsByType: Record<string, { total: number; count: number; availableCredit?: number }> = {};

    accounts.forEach((account) => {
      // Convert to GTQ if USD
      const balanceInGTQ =
        account.currency === "USD"
          ? account.balance * exchangeRate
          : account.balance;

      if (!accountsByType[account.type]) {
        accountsByType[account.type] = { total: 0, count: 0 };
      }
      accountsByType[account.type].total += balanceInGTQ;
      accountsByType[account.type].count += 1;

      if (account.type === "CREDIT_CARD") {
        totalDebt += balanceInGTQ;
        // Calculate available credit for credit cards
        if (account.creditLimit) {
          const limitInGTQ = account.currency === "USD"
            ? account.creditLimit * exchangeRate
            : account.creditLimit;
          const availableCredit = limitInGTQ - balanceInGTQ;
          accountsByType[account.type].availableCredit =
            (accountsByType[account.type].availableCredit || 0) + availableCredit;
        }
      } else {
        totalAvailable += balanceInGTQ;
      }
    });

    // Get recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id,
        isDismissed: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalAvailable,
      totalDebt,
      netBalance: totalAvailable - totalDebt,
      accountsByType: Object.entries(accountsByType).map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count,
        availableCredit: data.availableCredit,
      })),
      recentAlerts,
      exchangeRate,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
