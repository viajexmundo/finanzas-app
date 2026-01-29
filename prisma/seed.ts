import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await hash("viaja2025", 12);

  const admin = await prisma.user.upsert({
    where: { email: "alangarcia@viajexmundo.com.gt" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "alangarcia@viajexmundo.com.gt",
      name: "Alan García",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create default exchange rate
  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: "USD",
        toCurrency: "GTQ",
      },
    },
    update: {},
    create: {
      fromCurrency: "USD",
      toCurrency: "GTQ",
      rate: 7.85,
    },
  });

  console.log("Created default exchange rate: 1 USD = 7.85 GTQ");

  // Create default settings
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        displayCurrency: "GTQ",
        alertDaysBefore: 3,
        excessDebtThreshold: 80,
        highUsageThreshold: 80,
      },
    });
    console.log("Created default settings");
  }

  // Create sample banks
  const biBank = await prisma.bank.upsert({
    where: { id: "banco-industrial" },
    update: {},
    create: {
      id: "banco-industrial",
      name: "Banco Industrial",
      shortName: "BI",
      color: "#003B7A",
    },
  });

  const bamBank = await prisma.bank.upsert({
    where: { id: "bam" },
    update: {},
    create: {
      id: "bam",
      name: "BAM",
      shortName: "BAM",
      color: "#D4A017",
    },
  });

  console.log("Created sample banks:", biBank.name, bamBank.name);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
