// TUR #72.7 — User KVKK + Platform Agreement kanit alanlari
// Idempotent (IF NOT EXISTS)

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const statements = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkAcceptedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkVersion" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformAgreementAcceptedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformAgreementVersion" TEXT`,
];

(async () => {
  for (let i = 0; i < statements.length; i++) {
    try {
      await p.$executeRawUnsafe(statements[i]);
      console.log(`[${i + 1}/${statements.length}] OK · ${statements[i].slice(0, 80)}`);
    } catch (e) {
      console.error(`[${i + 1}/${statements.length}] HATA:`, e.message);
      process.exit(1);
    }
  }
  console.log("TUR72.7 SCHEMA BAŞARILI (lokal). Production: Render postinstall halleder.");
  process.exit(0);
})();
