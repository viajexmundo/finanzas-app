import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: { bank: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
    const {
      name,
      type,
      currency,
      balance,
      notes,
      bankId,
      creditLimit,
      cutoffDay,
      paymentDay,
      lastFourDigits,
    } = body;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        currency,
        balance: balance || 0,
        notes: notes || null,
        bankId: bankId || null,
        creditLimit: creditLimit || null,
        cutoffDay: cutoffDay || null,
        paymentDay: paymentDay || null,
        lastFourDigits: lastFourDigits || null,
        userId: session.user.id,
      },
      include: { bank: true },
    });

    // Create initial balance history
    await prisma.balanceHistory.create({
      data: {
        previousBalance: 0,
        newBalance: balance || 0,
        notes: "Saldo inicial",
        accountId: account.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating account:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
