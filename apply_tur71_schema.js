// TUR #71 A18 + A23 — Lokal Pulse + EmailDigest schema apply
// Idempotent (CREATE TABLE/INDEX/TYPE IF NOT EXISTS)

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const statements = [
  // PulseTrendType enum
  `DO $$ BEGIN
     CREATE TYPE "PulseTrendType" AS ENUM ('WEEKLY', 'MONTHLY');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,

  // EmailDigest tablo
  `CREATE TABLE IF NOT EXISTS "EmailDigest" (
     "id" TEXT NOT NULL,
     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "metrics" JSONB NOT NULL,
     "status" TEXT NOT NULL DEFAULT 'SENT',
     "error" TEXT,
     CONSTRAINT "EmailDigest_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "EmailDigest_sentAt_idx" ON "EmailDigest"("sentAt")`,

  // Pulse tablo
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
];

(async () => {
  for (let i = 0; i < statements.length; i++) {
    try {
      await p.$executeRawUnsafe(statements[i]);
      const firstLine = statements[i].trim().split("\n")[0].slice(0, 80);
      console.log(`[${i + 1}/${statements.length}] OK · ${firstLine}`);
    } catch (e) {
      console.error(`[${i + 1}/${statements.length}] HATA:`, e.message);
      process.exit(1);
    }
  }
  console.log("TUR71 SCHEMA BAŞARILI (lokal). Production: Render postinstall halleder.");
  process.exit(0);
})();
