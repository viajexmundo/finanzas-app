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
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (accountId) {
      where.OR = [
        { fromAccountId: accountId },
        { toAccountId: accountId },
      ];
    }
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        fromAccount: { include: { bank: true } },
        toAccount: { include: { bank: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role === "VIEWER") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { type, amount, description, category, date, fromAccountId, toAccountId } = body;

    if (!type || !amount || amount <= 0) {
      return NextResponse.json({ error: "Tipo y monto son requeridos" }, { status: 400 });
    }

    // Validate accounts based on type
    if (type === "INGRESO" && !toAccountId) {
      return NextResponse.json({ error: "Cuenta destino requerida" }, { status: 400 });
    }
    if (type === "EGRESO" && !fromAccountId) {
      return NextResponse.json({ error: "Cuenta origen requerida" }, { status: 400 });
    }
    if ((type === "TRANSFERENCIA" || type === "PAGO_TARJETA") && (!fromAccountId || !toAccountId)) {
      return NextResponse.json({ error: "Cuenta origen y destino requeridas" }, { status: 400 });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
        fromAccountId: fromAccountId || null,
        toAccountId: toAccountId || null,
        userId: session.user.id,
      },
    });

    // Update account balances
    if (fromAccountId) {
      const fromAccount = await prisma.account.findUnique({ where: { id: fromAccountId } });
      if (fromAccount) {
        const newBalance = fromAccount.type === "CREDIT_CARD"
          ? fromAccount.balance + amount // Credit card: spending increases debt
          : fromAccount.balance - amount; // Regular: spending decreases balance

        await prisma.account.update({
          where: { id: fromAccountId },
          data: { balance: newBalance },
        });
        await prisma.balanceHistory.create({
          data: {
            previousBalance: fromAccount.balance,
            newBalance,
            notes: `${type}: ${description || "Transacción"}`,
            accountId: fromAccountId,
            userId: session.user.id,
          },
        });
      }
    }

    if (toAccountId) {
      const toAccount = await prisma.account.findUnique({ where: { id: toAccountId } });
      if (toAccount) {
        const newBalance = toAccount.type === "CREDIT_CARD"
          ? toAccount.balance - amount // Credit card: payment reduces debt
          : toAccount.balance + amount; // Regular: deposit increases balance

        await prisma.account.update({
          where: { id: toAccountId },
          data: { balance: newBalance },
        });
        await prisma.balanceHistory.create({
          data: {
            previousBalance: toAccount.balance,
            newBalance,
            notes: `${type}: ${description || "Transacción"}`,
            accountId: toAccountId,
            userId: session.user.id,
          },
        });
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
