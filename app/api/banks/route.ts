import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(banks);
  } catch (error) {
    console.error("Error fetching banks:", error);
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { name, shortName, color, logo } = body;

    const bank = await prisma.bank.create({
      data: {
        name,
        shortName,
        color: color || "#3B82F6",
        logo,
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error("Error creating bank:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
