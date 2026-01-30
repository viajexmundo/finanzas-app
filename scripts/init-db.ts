import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing database...");

  // Check if admin user exists
  const existingUser = await prisma.user.findFirst({
    where: { email: "alangarcia@viajexmundo.com.gt" },
  });

  if (!existingUser) {
    // Create admin user
    const hashedPassword = await hash("viaja2025", 12);
    await prisma.user.create({
      data: {
        email: "alangarcia@viajexmundo.com.gt",
        password: hashedPassword,
        name: "Alan Garcia",
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("Admin user created: alangarcia@viajexmundo.com.gt");
  } else {
    console.log("Admin user already exists");
  }

  // Create default settings if not exist
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
    console.log("Default settings created");
  }

  console.log("Database initialization complete!");
}

main()
  .catch((e) => {
    console.error("Error initializing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
