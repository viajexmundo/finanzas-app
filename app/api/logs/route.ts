import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

// In-memory log storage (for production, use a file or database)
const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";
    const lines = parseInt(searchParams.get("lines") || "100");

    let logs = "";
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, "utf-8");
      const allLines = content.split("\n").filter(Boolean);
      logs = allLines.slice(-lines).join("\n");
    }

    if (download) {
      const dateStr = new Date().toISOString().split("T")[0];
      return new NextResponse(logs || "No hay logs disponibles", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="finanzas-logs-${dateStr}.txt"`,
        },
      });
    }

    return NextResponse.json({
      logs: logs || "No hay logs disponibles",
      file: LOG_FILE,
      exists: fs.existsSync(LOG_FILE),
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST to write a log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, data } = body;

    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level: level || "INFO",
      message,
      data,
    });

    fs.appendFileSync(LOG_FILE, logEntry + "\n");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing log:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE to clear logs
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, "");
    }

    return NextResponse.json({ success: true, message: "Logs limpiados" });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
