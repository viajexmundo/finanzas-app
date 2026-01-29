import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    users: any[];
    banks: any[];
    accounts: any[];
    transactions: any[];
    balanceHistory: any[];
    alerts: any[];
    exchangeRates: any[];
    settings: any[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only admins can import
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden importar" }, { status: 403 });
    }

    const body: BackupData = await request.json();

    // Validate backup structure
    if (!body.version || !body.data) {
      return NextResponse.json({ error: "Formato de backup inválido" }, { status: 400 });
    }

    const { data } = body;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const counts = {
        banks: 0,
        accounts: 0,
        transactions: 0,
        balanceHistory: 0,
        alerts: 0,
        exchangeRates: 0,
        settings: 0,
        skipped: 0,
      };

      // Import banks (upsert to avoid duplicates)
      for (const bank of data.banks || []) {
        try {
          await tx.bank.upsert({
            where: { id: bank.id },
            update: {
              name: bank.name,
              shortName: bank.shortName,
              color: bank.color,
              logo: bank.logo,
              isActive: bank.isActive,
            },
            create: {
              id: bank.id,
              name: bank.name,
              shortName: bank.shortName,
              color: bank.color,
              logo: bank.logo,
              isActive: bank.isActive,
            },
          });
          counts.banks++;
        } catch (e) {
          counts.skipped++;
        }
      }

      // Import accounts
      for (const account of data.accounts || []) {
        try {
          // Check if user exists
          const userExists = await tx.user.findUnique({ where: { id: account.userId } });
          if (!userExists) {
            counts.skipped++;
            continue;
          }

          await tx.account.upsert({
            where: { id: account.id },
            update: {
              name: account.name,
              type: account.type,
              currency: account.currency,
              lastFourDigits: account.lastFourDigits,
              balance: account.balance,
              notes: account.notes,
              isActive: account.isActive,
              creditLimit: account.creditLimit,
              cutoffDay: account.cutoffDay,
              paymentDay: account.paymentDay,
              bankId: account.bankId,
            },
            create: {
              id: account.id,
              name: account.name,
              type: account.type,
              currency: account.currency,
              lastFourDigits: account.lastFourDigits,
              balance: account.balance,
              notes: account.notes,
              isActive: account.isActive,
              creditLimit: account.creditLimit,
              cutoffDay: account.cutoffDay,
              paymentDay: account.paymentDay,
              bankId: account.bankId,
              userId: account.userId,
            },
          });
          counts.accounts++;
        } catch (e) {
          counts.skipped++;
        }
      }

      // Import transactions
      for (const transaction of data.transactions || []) {
        try {
          // Check if transaction already exists
          const exists = await tx.transaction.findUnique({ where: { id: transaction.id } });
          if (exists) {
            counts.skipped++;
            continue;
          }

          // Check if user exists
          const userExists = await tx.user.findUnique({ where: { id: transaction.userId } });
          if (!userExists) {
            counts.skipped++;
            continue;
          }

          await tx.transaction.create({
            data: {
              id: transaction.id,
              type: transaction.type,
              amount: transaction.amount,
              description: transaction.description,
              category: transaction.category,
              date: new Date(transaction.date),
              fromAccountId: transaction.fromAccountId,
              toAccountId: transaction.toAccountId,
              userId: transaction.userId,
              createdAt: new Date(transaction.createdAt),
            },
          });
          counts.transactions++;
        } catch (e) {
          counts.skipped++;
        }
      }

      // Import balance history
      for (const bh of data.balanceHistory || []) {
        try {
          const exists = await tx.balanceHistory.findUnique({ where: { id: bh.id } });
          if (exists) {
            counts.skipped++;
            continue;
          }

          await tx.balanceHistory.create({
            data: {
              id: bh.id,
              previousBalance: bh.previousBalance,
              newBalance: bh.newBalance,
              notes: bh.notes,
              createdAt: new Date(bh.createdAt),
              accountId: bh.accountId,
              userId: bh.userId,
            },
          });
          counts.balanceHistory++;
        } catch (e) {
          counts.skipped++;
        }
      }

      // Import exchange rates
      for (const er of data.exchangeRates || []) {
        try {
          await tx.exchangeRate.upsert({
            where: {
              fromCurrency_toCurrency: {
                fromCurrency: er.fromCurrency,
                toCurrency: er.toCurrency,
              },
            },
            update: { rate: er.rate },
            create: {
              id: er.id,
              fromCurrency: er.fromCurrency,
              toCurrency: er.toCurrency,
              rate: er.rate,
            },
          });
          counts.exchangeRates++;
        } catch (e) {
          counts.skipped++;
        }
      }

      // Import settings
      for (const setting of data.settings || []) {
        try {
          await tx.settings.upsert({
            where: { id: setting.id },
            update: {
              displayCurrency: setting.displayCurrency,
              alertDaysBefore: setting.alertDaysBefore,
              excessDebtThreshold: setting.excessDebtThreshold,
              highUsageThreshold: setting.highUsageThreshold,
            },
            create: {
              id: setting.id,
              displayCurrency: setting.displayCurrency,
              alertDaysBefore: setting.alertDaysBefore,
              excessDebtThreshold: setting.excessDebtThreshold,
              highUsageThreshold: setting.highUsageThreshold,
            },
          });
          counts.settings++;
        } catch (e) {
          counts.skipped++;
        }
      }

      return counts;
    });

    return NextResponse.json({
      success: true,
      message: "Backup importado correctamente",
      imported: result,
    });
  } catch (error) {
    console.error("Error importing backup:", error);
    return NextResponse.json({ error: "Error al importar backup" }, { status: 500 });
  }
}
