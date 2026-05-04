// TUR #72.8 H1 — Schema drift kapatma (production deploy postinstall hook)
// 3 TUR'un schema değişiklikleri tek script'te idempotent IF NOT EXISTS:
//   - TUR #71 (EmailDigest + Pulse)
//   - TUR #72.6 (User 2FA backup codes + enabledAt + method enum)
//   - TUR #72.7 (User KVKK + agreement kanit alanlari)
//
// Madde 30.22: schema değişikliği eklenen TUR sonunda postinstall hook + production smoke
// Lokal: idempotent, no-op eğer apply edilmişse
// Production: Render postinstall otomatik çalışır

const { PrismaClient } = require("@prisma/client");

const STATEMENTS = [
  // ─── TUR #71 — EmailDigest + Pulse ─────────────────────────────────────
  `DO $$ BEGIN
     CREATE TYPE "PulseTrendType" AS ENUM ('WEEKLY', 'MONTHLY');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,
  `CREATE TABLE IF NOT EXISTS "EmailDigest" (
     "id" TEXT NOT NULL,
     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "metrics" JSONB NOT NULL,
     "status" TEXT NOT NULL DEFAULT 'SENT',
     "error" TEXT,
     CONSTRAINT "EmailDigest_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "EmailDigest_sentAt_idx" ON "EmailDigest"("sentAt")`,
  `CREATE TABLE IF NOT EXISTS "Pulse" (
     "id" TEXT NOT NULL,
     "weekStart" TIMESTAMP(3) NOT NULL,
     "metrics" JSONB NOT NULL,
     "trendType" "PulseTrendType" NOT NULL DEFAULT 'WEEKLY',
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Pulse_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Pulse_weekStart_key" ON "Pulse"("weekStart")`,
  `CREATE INDEX IF NOT EXISTS "Pulse_weekStart_idx" ON "Pulse"("weekStart")`,

  // ─── TUR #72.6 — User 2FA ek alanlar ───────────────────────────────────
  `DO $$ BEGIN
     CREATE TYPE "TwoFactorMethod" AS ENUM ('TOTP', 'SMS', 'EMAIL');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" JSONB`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabledAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorMethod" "TwoFactorMethod" NOT NULL DEFAULT 'TOTP'`,

  // ─── TUR #72.7 — User KVKK + Platform Agreement kanıt ──────────────────
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkAcceptedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkVersion" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformAgreementAcceptedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformAgreementVersion" TEXT`,
];

(async () => {
  const p = new PrismaClient();
  let okCount = 0;
  let errCount = 0;

  for (let i = 0; i < STATEMENTS.length; i++) {
    const sql = STATEMENTS[i];
    const preview = sql.trim().split("\n")[0].slice(0, 80).replace(/\s+/g, " ");
    try {
      await p.$executeRawUnsafe(sql);
      console.log(`[${i + 1}/${STATEMENTS.length}] OK · ${preview}`);
      okCount++;
    } catch (e) {
      console.error(`[${i + 1}/${STATEMENTS.length}] HATA · ${preview}\n  ${e.message}`);
      errCount++;
    }
  }

  console.log(`\n✓ APPLY-PENDING-SCHEMAS · ${okCount}/${STATEMENTS.length} OK · ${errCount} hata`);

  await p.$disconnect();

  // Production'da hata olursa exit 0 ile çık (postinstall fail etmesin, idempotent çalışıyor)
  // Lokal'de DB yoksa da postinstall fail etmesin.
  process.exit(0);
})().catch((err) => {
  console.error("apply-pending-schemas catastrophic error:", err.message);
  process.exit(0);
});
