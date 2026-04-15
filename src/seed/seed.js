const bcrypt = require("bcryptjs");
const prisma = require("../config/db");

async function main() {
  const adminPassword = await bcrypt.hash("Admin123*", 10);
  const lawyerPassword = await bcrypt.hash("Lawyer123*", 10);
  const salesPassword = await bcrypt.hash("Sales123*", 10);

  await prisma.user.upsert({
    where: { email: "admin@tedbirge.ai" },
    update: {},
    create: {
      fullName: "Sistem Admin",
      email: "admin@tedbirge.ai",
      passwordHash: adminPassword,
      role: "ADMIN",
      phone: "905000000001"
    }
  });

  await prisma.user.upsert({
    where: { email: "sales@tedbirge.ai" },
    update: {},
    create: {
      fullName: "Satis Uzmani",
      email: "sales@tedbirge.ai",
      passwordHash: salesPassword,
      role: "SALES",
      phone: "905000000002"
    }
  });

  await prisma.user.upsert({
    where: { email: "lawyer@tedbirge.ai" },
    update: {},
    create: {
      fullName: "Demo Avukat",
      email: "lawyer@tedbirge.ai",
      passwordHash: lawyerPassword,
      role: "LAWYER",
      phone: "905000000003"
    }
  });

  console.log("Seed tamamlandi");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
