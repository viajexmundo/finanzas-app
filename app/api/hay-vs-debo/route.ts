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

    // Get exchange rate
    const exchangeRateRecord = await prisma.exchangeRate.findFirst({
      where: { fromCurrency: "USD", toCurrency: "GTQ" },
    });
    const exchangeRate = exchangeRateRecord?.rate || 7.85;

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        bank: {
          select: { name: true, color: true, logo: true },
        },
      },
      orderBy: { balance: "desc" },
    });

    // Separate into HAY (assets) and DEBO (debts)
    const hay = accounts.filter((a) => a.type !== "CREDIT_CARD");
    const debo = accounts.filter((a) => a.type === "CREDIT_CARD");

    // Calculate totals in GTQ
    let totalHay = 0;
    let totalDebo = 0;

    hay.forEach((account) => {
      const balanceInGTQ =
        account.currency === "USD"
          ? account.balance * exchangeRate
          : account.balance;
      totalHay += balanceInGTQ;
    });

    debo.forEach((account) => {
      const balanceInGTQ =
        account.currency === "USD"
          ? account.balance * exchangeRate
          : account.balance;
      totalDebo += balanceInGTQ;
    });

    return NextResponse.json({
      hay,
      debo,
      totalHay,
      totalDebo,
      saldoNeto: totalHay - totalDebo,
      exchangeRate,
    });
  } catch (error) {
    console.error("Error fetching hay vs debo data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
