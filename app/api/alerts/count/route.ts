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

    const count = await prisma.alert.count({
      where: {
        userId: session.user.id,
        isRead: false,
        isDismissed: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching alert count:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
