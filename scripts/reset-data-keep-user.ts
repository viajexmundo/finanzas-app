import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetData() {
  console.log("Reiniciando datos (manteniendo usuario admin)...\n");

  // Borrar en orden por dependencias
  console.log("Borrando transacciones...");
  await prisma.transaction.deleteMany({});

  console.log("Borrando historial de balance...");
  await prisma.balanceHistory.deleteMany({});

  console.log("Borrando alertas...");
  await prisma.alert.deleteMany({});

  console.log("Borrando cuentas...");
  await prisma.account.deleteMany({});

  console.log("Borrando bancos...");
  await prisma.bank.deleteMany({});

  console.log("Borrando tipo de cambio...");
  await prisma.exchangeRate.deleteMany({});

  console.log("Borrando configuración...");
  await prisma.settings.deleteMany({});

  // Recrear datos base
  console.log("\nCreando datos base...");

  // Tipo de cambio
  await prisma.exchangeRate.create({
    data: {
      fromCurrency: "USD",
      toCurrency: "GTQ",
      rate: 7.75,
    },
  });
  console.log("✓ Tipo de cambio: 1 USD = Q7.75");

  // Configuración
  await prisma.settings.create({
    data: {
      alertDaysBefore: 3,
      highUsageThreshold: 80,
    },
  });
  console.log("✓ Configuración creada");

  // Bancos guatemaltecos
  const banks = [
    { name: "Banco Industrial", shortName: "BI", color: "#003366", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logo_del_Banco_Industrial.svg/320px-Logo_del_Banco_Industrial.svg.png" },
    { name: "Banco G&T Continental", shortName: "G&T", color: "#00A651", logo: "https://agenciabancagt.com/wp-content/uploads/2020/08/logo-banco-gt.png" },
    { name: "BAC Credomatic", shortName: "BAC", color: "#E31837", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/BAC_Credomatic_logo.svg/320px-BAC_Credomatic_logo.svg.png" },
    { name: "Banco de América Central", shortName: "BAM", color: "#005BAA", logo: "https://www.bam.com.gt/wp-content/themes/flavor/library/images/logo-color-bam.png" },
    { name: "Banrural", shortName: "Banrural", color: "#00843D", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Logotipo_banrural_verde.png" },
  ];

  for (const bank of banks) {
    await prisma.bank.create({ data: bank });
  }
  console.log(`✓ ${banks.length} bancos creados`);

  // Verificar usuario existente
  const users = await prisma.user.findMany();
  console.log(`\n✓ Usuarios existentes: ${users.length} (no modificados)`);
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`));

  await prisma.$disconnect();

  console.log("\n========================================");
  console.log("Base de datos reiniciada exitosamente");
  console.log("Usuario admin conservado");
  console.log("========================================\n");
}

resetData().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
