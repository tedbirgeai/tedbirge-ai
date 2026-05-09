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

  // ─── TUR #84 T3 — Kullanıcı CRUD KVKK alanları (Madde 30.37) ────────────
  `DO $$ BEGIN
     CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'SUSPENDED', 'ARCHIVED');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE'`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPasswordResetAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetByAdminId" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePasswordOnNextLogin" BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt")`,
  `CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status")`,

  // ─── TUR #85 S2 — Performans indexler (Madde 30.41) ─────────────────────
  // User: rol + durum filtreli ADMIN listesi
  `CREATE INDEX IF NOT EXISTS "User_role_status_idx" ON "User"("role", "status")`,
  // Lead: telefon ile arama + status filter + ownerId lookup
  `CREATE INDEX IF NOT EXISTS "Lead_customerPhone_idx" ON "Lead"("customerPhone")`,
  `CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")`,
  `CREATE INDEX IF NOT EXISTS "Lead_ownerId_idx" ON "Lead"("ownerId")`,
  // ActivityLog: createdAt DESC sıralı, leadId/action filtreli sorgu
  `CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "ActivityLog_leadId_createdAt_idx" ON "ActivityLog"("leadId", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt" DESC)`,

  // ─── TUR #91 P2 — Performans indexler 2. dalga (Madde 30.41 R1) ──────────
  // RealtimeEvent: ADMIN_FEED + LAWYER_<id> + scope channel sorgulari + Healer purge
  `CREATE INDEX IF NOT EXISTS "RealtimeEvent_channel_consumed_createdAt_idx" ON "RealtimeEvent"("channel", "consumed", "createdAt" DESC)`,
  // Document: analyzer + finalize-upload sorgulari (status filtreli + 24h stuck)
  `CREATE INDEX IF NOT EXISTS "Document_leadId_status_idx" ON "Document"("leadId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Document_status_createdAt_idx" ON "Document"("status", "createdAt" DESC)`,
  // Lead: dashboard sorgu (status + createdAt sirali) + aciliyet filter
  `CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt" DESC)`,
  // CommissionLog: temsilci hakedis sorgusu (Healer modülü auto-create için)
  `CREATE INDEX IF NOT EXISTS "CommissionLog_temsilciId_createdAt_idx" ON "CommissionLog"("temsilciId", "createdAt" DESC)`,
  // PhoneOtp: cleanup expired OTPs (PhoneOtp purge query)
  `CREATE INDEX IF NOT EXISTS "PhoneOtp_phone_expiresAt_idx" ON "PhoneOtp"("phone", "expiresAt")`,

  // ─── TUR #99 Q1 — RolePermission (Madde 30.55 RBAC Yetki Yönetim Disiplini) ──
  `CREATE TABLE IF NOT EXISTS "RolePermission" (
     "id" TEXT NOT NULL,
     "role" TEXT NOT NULL,
     "module" TEXT NOT NULL,
     "action" TEXT NOT NULL,
     "granted" BOOLEAN NOT NULL DEFAULT false,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedById" TEXT,
     CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_module_action_key" ON "RolePermission"("role", "module", "action")`,
  `CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role")`,
  `CREATE INDEX IF NOT EXISTS "RolePermission_module_idx" ON "RolePermission"("module")`,

  // ─── TUR #103 — e-baro Manuel Doğrulama (Madde 38) ──────────────────────
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ebaroVerifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ebaroVerifiedBy" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ebaroVerifyMethod" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ebaroVerifyNotes" TEXT`,

  // ─── TUR #104 — UYAP Manuel Veri Altyapısı (Madde 39) ───────────────────
  // Lead UYAP ek alanlar (uyapDosyaNo + uyapDurum + uyapMahkeme + uyapSonGuncelleme zaten var).
  // Duruşma takibi mevcut "Durusma" modeli ile yapılır (Madde 14.3 — duplikat yasak).
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "uyapDosyaTuru" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "uyapNotlar" TEXT`,
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
