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
    const period = searchParams.get("period") || "monthly";

    const now = new Date();
    const from = new Date();
    if (period === "weekly") {
      from.setDate(now.getDate() - 7);
    } else {
      from.setDate(now.getDate() - 30);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: from, lte: now },
      },
      include: {
        fromAccount: true,
        toAccount: true,
        user: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Build CSV
    const headers = ["Fecha", "Tipo", "Monto", "Cuenta Origen", "Cuenta Destino", "Categoría", "Descripción", "Usuario"];
    const rows = transactions.map((t) => [
      t.date.toISOString().split("T")[0],
      t.type,
      t.amount.toFixed(2),
      t.fromAccount?.name || "",
      t.toAccount?.name || "",
      t.category || "",
      (t.description || "").replace(/,/g, ";"),
      t.user.name,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateStr = now.toISOString().split("T")[0];
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-${period}-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
