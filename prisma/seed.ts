import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Default categories ---
  const categories = [
    { label: "Boiler Chicken", value: "boiler", unit: "kg" },
    { label: "Layer Chicken", value: "layer", unit: "kg" },
    { label: "Eggs", value: "egg", unit: "piece" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { value: c.value },
      update: {},
      create: c,
    });
  }

  console.log("✅ Categories seeded!");

  // --- Default Admin Users ---
  const admins = [
    {
      username: process.env.ADMIN1_USERNAME!,
      passwordHash: await bcrypt.hash(process.env.ADMIN1_PASSWORD!, 10),
    },
    {
      username: process.env.ADMIN2_USERNAME!,
      passwordHash: await bcrypt.hash(process.env.ADMIN2_PASSWORD!, 10),
    },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { username: admin.username },
      update: {},
      create: {
        username: admin.username,
        passwordHash: admin.passwordHash,
        role: "admin",
      },
    });
  }

  console.log("✅ Admin users seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
