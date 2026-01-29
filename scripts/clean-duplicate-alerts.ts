import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log("Limpiando alertas duplicadas...");

  // Get all alerts
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const alert of alerts) {
    let key = alert.type;
    try {
      const data = JSON.parse(alert.data || "{}");
      if (data.accountId) {
        key += "-" + data.accountId;
      }
    } catch {}

    // Keep only the first non-dismissed alert of each type/account
    const isDismissed = alert.isDismissed;
    if (seen.has(key) && !isDismissed) {
      toDelete.push(alert.id);
    } else if (!isDismissed) {
      seen.set(key, alert.id);
    }
  }

  if (toDelete.length > 0) {
    await prisma.alert.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`✅ Eliminadas ${toDelete.length} alertas duplicadas`);
  } else {
    console.log("✅ No se encontraron duplicados");
  }

  // Show remaining alerts
  const remaining = await prisma.alert.count({ where: { isDismissed: false } });
  console.log(`📊 Alertas activas restantes: ${remaining}`);

  await prisma.$disconnect();
}

cleanDuplicates().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
