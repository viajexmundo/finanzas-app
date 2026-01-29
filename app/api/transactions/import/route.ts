import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface CsvRow {
  fecha: string;
  tipo: string;
  monto: string;
  cuenta_origen: string;
  cuenta_destino: string;
  descripcion: string;
  categoria: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row as unknown as CsvRow);
  }

  return rows;
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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV vacío o formato inválido" }, { status: 400 });
    }

    // Get all active accounts for name or last-4-digits matching
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
    });
    const accountByName = new Map(accounts.map((a) => [a.name.toLowerCase(), a]));
    const accountByDigits = new Map(
      accounts
        .filter((a) => a.lastFourDigits)
        .map((a) => [a.lastFourDigits!, a])
    );

    const findAccount = (value: string | undefined) => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      // Try by name first
      const byName = accountByName.get(trimmed.toLowerCase());
      if (byName) return byName;
      // Try by last 4 digits (e.g. "1414")
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length === 4) {
        const byDigits = accountByDigits.get(digits);
        if (byDigits) return byDigits;
      }
      return null;
    };

    const results = { success: 0, errors: [] as string[] };
    const validTypes = ["INGRESO", "EGRESO", "TRANSFERENCIA", "PAGO_TARJETA"];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // +2 for header + 0-index

      const type = row.tipo?.toUpperCase();
      const amount = parseFloat(row.monto);

      if (!validTypes.includes(type)) {
        results.errors.push(`Línea ${lineNum}: Tipo inválido "${row.tipo}"`);
        continue;
      }
      if (isNaN(amount) || amount <= 0) {
        results.errors.push(`Línea ${lineNum}: Monto inválido "${row.monto}"`);
        continue;
      }

      const fromAccount = findAccount(row.cuenta_origen);
      const toAccount = findAccount(row.cuenta_destino);

      // Validate accounts by type
      if ((type === "EGRESO") && row.cuenta_origen && !fromAccount) {
        results.errors.push(`Línea ${lineNum}: Cuenta origen no encontrada "${row.cuenta_origen}"`);
        continue;
      }
      if ((type === "INGRESO") && row.cuenta_destino && !toAccount) {
        results.errors.push(`Línea ${lineNum}: Cuenta destino no encontrada "${row.cuenta_destino}"`);
        continue;
      }
      if ((type === "TRANSFERENCIA" || type === "PAGO_TARJETA") && (!fromAccount || !toAccount)) {
        results.errors.push(`Línea ${lineNum}: Cuentas origen/destino requeridas para ${type}`);
        continue;
      }

      try {
        // Create transaction
        await prisma.transaction.create({
          data: {
            type,
            amount,
            description: row.descripcion || null,
            category: row.categoria || null,
            date: row.fecha ? new Date(row.fecha) : new Date(),
            fromAccountId: fromAccount?.id || null,
            toAccountId: toAccount?.id || null,
            userId: session.user.id,
          },
        });

        // Update balances
        if (fromAccount) {
          const newBal = fromAccount.type === "CREDIT_CARD"
            ? fromAccount.balance + amount
            : fromAccount.balance - amount;
          await prisma.account.update({ where: { id: fromAccount.id }, data: { balance: newBal } });
          await prisma.balanceHistory.create({
            data: {
              previousBalance: fromAccount.balance,
              newBalance: newBal,
              notes: `Importación CSV: ${row.descripcion || type}`,
              accountId: fromAccount.id,
              userId: session.user.id,
            },
          });
          fromAccount.balance = newBal; // Update local ref for subsequent rows
        }

        if (toAccount) {
          const newBal = toAccount.type === "CREDIT_CARD"
            ? toAccount.balance - amount
            : toAccount.balance + amount;
          await prisma.account.update({ where: { id: toAccount.id }, data: { balance: newBal } });
          await prisma.balanceHistory.create({
            data: {
              previousBalance: toAccount.balance,
              newBalance: newBal,
              notes: `Importación CSV: ${row.descripcion || type}`,
              accountId: toAccount.id,
              userId: session.user.id,
            },
          });
          toAccount.balance = newBal;
        }

        results.success++;
      } catch (err) {
        results.errors.push(`Línea ${lineNum}: Error al procesar`);
      }
    }

    return NextResponse.json({
      total: rows.length,
      success: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
