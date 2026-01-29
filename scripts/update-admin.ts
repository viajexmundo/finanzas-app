import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Actualizando usuario administrador...");

  const hashedPassword = await hash("viaja2025", 12);

  // Buscar si existe el usuario admin antiguo
  const oldAdmin = await prisma.user.findUnique({
    where: { email: "admin@empresa.com" },
  });

  // Buscar si ya existe el nuevo usuario
  const newAdmin = await prisma.user.findUnique({
    where: { email: "alangarcia@viajexmundo.com.gt" },
  });

  if (newAdmin) {
    // Actualizar contraseña del usuario existente
    await prisma.user.update({
      where: { email: "alangarcia@viajexmundo.com.gt" },
      data: {
        password: hashedPassword,
        name: "Alan García",
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✅ Usuario actualizado: alangarcia@viajexmundo.com.gt");
  } else if (oldAdmin) {
    // Actualizar el usuario antiguo con los nuevos datos
    await prisma.user.update({
      where: { email: "admin@empresa.com" },
      data: {
        email: "alangarcia@viajexmundo.com.gt",
        name: "Alan García",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✅ Usuario migrado de admin@empresa.com a alangarcia@viajexmundo.com.gt");
  } else {
    // Crear nuevo usuario
    await prisma.user.create({
      data: {
        email: "alangarcia@viajexmundo.com.gt",
        name: "Alan García",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✅ Usuario creado: alangarcia@viajexmundo.com.gt");
  }

  console.log("\n📧 Email: alangarcia@viajexmundo.com.gt");
  console.log("🔑 Contraseña: viaja2025");
  console.log("\n¡Listo! Ya puedes iniciar sesión.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
