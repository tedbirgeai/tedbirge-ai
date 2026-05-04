// TUR #72.6 — User 2FA ek alanlar (backup codes + enabledAt + method enum)
// Idempotent (DO $$ + IF NOT EXISTS)

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const statements = [
  `DO $$ BEGIN
     CREATE TYPE "TwoFactorMethod" AS ENUM ('TOTP', 'SMS', 'EMAIL');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" JSONB`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabledAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorMethod" "TwoFactorMethod" NOT NULL DEFAULT 'TOTP'`,
];

(async () => {
  for (let i = 0; i < statements.length; i++) {
    try {
      await p.$executeRawUnsafe(statements[i]);
      console.log(`[${i + 1}/${statements.length}] OK · ${statements[i].slice(0, 80).replace(/\s+/g, " ")}`);
    } catch (e) {
      console.error(`[${i + 1}/${statements.length}] HATA:`, e.message);
      process.exit(1);
    }
  }
  console.log("TUR72.6 SCHEMA BAŞARILI (lokal). Production: Render postinstall halleder.");
  process.exit(0);
})();
