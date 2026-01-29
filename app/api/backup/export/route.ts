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

    // Only admins can export
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden exportar" }, { status: 403 });
    }

    // Export all data
    const [
      users,
      banks,
      accounts,
      transactions,
      balanceHistory,
      alerts,
      exchangeRates,
      settings,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          // Exclude password for security
        },
      }),
      prisma.bank.findMany(),
      prisma.account.findMany(),
      prisma.transaction.findMany(),
      prisma.balanceHistory.findMany(),
      prisma.alert.findMany(),
      prisma.exchangeRate.findMany(),
      prisma.settings.findMany(),
    ]);

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email,
      data: {
        users,
        banks,
        accounts,
        transactions,
        balanceHistory,
        alerts,
        exchangeRates,
        settings,
      },
      counts: {
        users: users.length,
        banks: banks.length,
        accounts: accounts.length,
        transactions: transactions.length,
        balanceHistory: balanceHistory.length,
        alerts: alerts.length,
        exchangeRates: exchangeRates.length,
        settings: settings.length,
      },
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(jsonStr, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="finanzas-backup-${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting backup:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
