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

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          displayCurrency: "GTQ",
          alertDaysBefore: 3,
          excessDebtThreshold: 80,
          highUsageThreshold: 80,
        },
      });
    }

    // Get exchange rate
    let exchangeRate = await prisma.exchangeRate.findFirst({
      where: { fromCurrency: "USD", toCurrency: "GTQ" },
    });

    if (!exchangeRate) {
      exchangeRate = await prisma.exchangeRate.create({
        data: {
          fromCurrency: "USD",
          toCurrency: "GTQ",
          rate: 7.85,
        },
      });
    }

    return NextResponse.json({
      ...settings,
      exchangeRate: exchangeRate.rate,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const {
      displayCurrency,
      alertDaysBefore,
      excessDebtThreshold,
      highUsageThreshold,
      exchangeRate,
    } = body;

    // Update or create settings
    let settings = await prisma.settings.findFirst();

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          displayCurrency,
          alertDaysBefore,
          excessDebtThreshold,
          highUsageThreshold,
        },
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          displayCurrency,
          alertDaysBefore,
          excessDebtThreshold,
          highUsageThreshold,
        },
      });
    }

    // Update exchange rate
    if (exchangeRate) {
      await prisma.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: "USD",
            toCurrency: "GTQ",
          },
        },
        update: { rate: exchangeRate },
        create: {
          fromCurrency: "USD",
          toCurrency: "GTQ",
          rate: exchangeRate,
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
