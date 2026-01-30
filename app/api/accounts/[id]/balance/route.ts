import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { balance, notes } = body;

    // Get current account
    const currentAccount = await prisma.account.findUnique({
      where: { id: params.id },
    });

    if (!currentAccount) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    // Update balance
    const account = await prisma.account.update({
      where: { id: params.id },
      data: { balance },
      include: { bank: true },
    });

    // Create balance history record
    await prisma.balanceHistory.create({
      data: {
        previousBalance: currentAccount.balance,
        newBalance: balance,
        notes,
        accountId: params.id,
        userId: session.user.id,
      },
    });

    // Check for alerts
    if (account.type === "CREDIT_CARD" && account.creditLimit) {
      const usagePercentage = (balance / account.creditLimit) * 100;

      // Get settings
      const settings = await prisma.settings.findFirst();
      const threshold = settings?.highUsageThreshold || 80;

      if (usagePercentage >= threshold) {
        // Create high usage alert
        await prisma.alert.create({
          data: {
            type: "HIGH_USAGE",
            message: `${account.name} al ${usagePercentage.toFixed(0)}% de su límite`,
            data: JSON.stringify({ accountId: account.id, usage: usagePercentage }),
            userId: session.user.id,
          },
        });
      }
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
