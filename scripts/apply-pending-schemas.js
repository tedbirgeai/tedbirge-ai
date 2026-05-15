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

  // ─── TUR #110 C1 — JudicialResponse: ilk dava kapanisi veri toplama (Madde 28) ───
  // 6 alan: leadId (FK unique) + finalAmount + tedbirgeAITahmin + deviationPct + judgeNotes + decisionDate
  // Modul YOK — 50+ dava kayitlandiginda eklenir (kanit-bazli, mektup C2 emsali)
  `CREATE TABLE IF NOT EXISTS "JudicialResponse" (
     "id" TEXT NOT NULL,
     "leadId" TEXT NOT NULL,
     "finalAmount" DOUBLE PRECISION,
     "tedbirgeAITahmin" DOUBLE PRECISION,
     "deviationPct" DOUBLE PRECISION,
     "judgeNotes" TEXT,
     "decisionDate" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "createdById" TEXT,
     CONSTRAINT "JudicialResponse_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "JudicialResponse_leadId_key" ON "JudicialResponse"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "JudicialResponse_decisionDate_idx" ON "JudicialResponse"("decisionDate" DESC)`,
  `DO $$ BEGIN
     ALTER TABLE "JudicialResponse" ADD CONSTRAINT "JudicialResponse_leadId_fkey"
       FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,

  // ─── TUR #110 C3 — Lead.firstRealLead: ilk gercek lead milestone flag ────
  // Niyazi'nin ilk gercek lead'i (test degil) bu flag ile isaretlenir.
  // ADMIN_FEED celebration RealtimeEvent + Reporter milestone log.
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "firstRealLead" BOOLEAN NOT NULL DEFAULT false`,

  // ─── TUR #116 — User adres alanlari (KIRMIZI cizgi, CEO yazili onay Madde 18.3 + 30.71) ──
  // bolge alani korundu (Madde 4.6 geriye uyumluluk). 4 yeni additive alan:
  // address (acik adres), city (sehir/il), district (ilce), postalCode (posta kodu)
  // Kartvizit ve vCard'da kullanilir. Profil sayfasinda edit edilir.
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "district" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalCode" TEXT`,

  // ─── TUR #117 — User.country (KIRMIZI cizgi, CEO yazili onay Madde 18.3 + 30.71 + 30.73) ──
  // Almanya pilot 2028+ hazirlik (Madde 30.73 Gelecege Hazirlik Disiplini).
  // Mevcut user'lar otomatik 'Türkiye' default alir.
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'Türkiye'`,

  // ─── TUR #121 M2 — DocumentStatus enum + STUCK + DELETED (KIRMIZI, CEO yazili onay Madde 18.3 + 30.71) ──
  // PostgreSQL'de ALTER TYPE ADD VALUE IF NOT EXISTS — PG 12+ destekler (Supabase >= 14).
  // CONCURRENT VALUE limit: yeni enum value transaction icinde commit edilemez,
  // ama IF NOT EXISTS idempotent. AUTOCOMMIT mode prisma.$executeRawUnsafe ile.
  `ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'STUCK'`,
  `ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'DELETED'`,

  // ─── TUR #121 M4 — EmailOtp table + User email/phone change pending columns ──
  // CEO yazili onay (Madde 18.3 + 30.71 KIRMIZI Gecis Protokolu + 30.80 Cift Kanal Dogrulama).
  // PhoneOtp emsali (TUR #113 + #116), email kanali icin idempotent CREATE.
  `CREATE TABLE IF NOT EXISTS "EmailOtp" (
     "id" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     "code" TEXT NOT NULL,
     "purpose" TEXT NOT NULL,
     "expiresAt" TIMESTAMP(3) NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "EmailOtp_email_purpose_idx" ON "EmailOtp"("email", "purpose")`,
  `CREATE INDEX IF NOT EXISTS "EmailOtp_expiresAt_idx" ON "EmailOtp"("expiresAt")`,

  // User 24h onay penceresi alanlari (KVKK m.11 hak)
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailChangePendingUntil" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneChangePendingUntil" TIMESTAMP(3)`,

  // ─── TUR #132 M1 — AI Cekirdek (TAC) Belge Ayristirici (KIRMIZI 1, CEO yazili onay Madde 18.3 + 30.71) ──
  // Document 6 yeni alan (additive, Madde 4.6 — mevcut aiAnalysis/extractedJson korunur)
  // aiAnalysisJson: yapilandirilmis JSON cikti (documentType + extractedData + confidence)
  // aiConfidence: 0.0-1.0 overall confidence skoru
  // aiAnalyzedAt: AI analiz tamamlanma zamani
  // aiModelVersion: kullanilan Claude model versiyonu (Madde 30.78)
  // needsManualReview: <0.85 confidence VEYA saglik verisi (KVKK m.6) → avukat onay
  // manualReviewReason: insan-okur kaltif/inceleme nedeni
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "aiAnalysisJson" JSONB`,
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "aiConfidence" DOUBLE PRECISION`,
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "aiAnalyzedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "aiModelVersion" TEXT`,
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "needsManualReview" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "manualReviewReason" TEXT`,

  // ─── TUR #132 M1 — User KVKK m.6 acik riza alanlari (Madde 30.91 yeni) ───
  // Ozel nitelikli kisisel veri (saglik epikriz/SGK raporu) icin acik riza zorunlu
  // ip + UA kanit-bazli audit (Madde 30.75)
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkM6ConsentAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkM6ConsentIp" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kvkkM6ConsentUA" TEXT`,

  // ─── TUR #132.1 — M2 erken cikis (KIRMIZI 2 + KIRMIZI 3, CEO yazili onay Madde 18.3 + 30.71) ──
  // AccidentType enum (idempotent — pg_type kontrol)
  `DO $$ BEGIN
     CREATE TYPE "AccidentType" AS ENUM ('TRAFFIC', 'WORK', 'OTHER');
   EXCEPTION WHEN duplicate_object THEN null;
   END $$`,

  // InsuranceCompany tablosu (Madde 30.92 Master Data Disiplini yeni)
  `CREATE TABLE IF NOT EXISTS "InsuranceCompany" (
     "id" TEXT NOT NULL,
     "name" TEXT NOT NULL,
     "shortName" TEXT,
     "kepAddress" TEXT,
     "email" TEXT,
     "phone" TEXT,
     "address" TEXT,
     "policyPrefix" TEXT[] DEFAULT '{}',
     "active" BOOLEAN NOT NULL DEFAULT TRUE,
     "dataVersion" TEXT NOT NULL DEFAULT 'v1-2026',
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "InsuranceCompany_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "InsuranceCompany_name_key" ON "InsuranceCompany"("name")`,

  // Lead yeni 11 alan (Madde 4.6: mevcut accidentDate/accidentType/maluliyetOrani/kusurOrani/faultRate korunur)
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "kazaTuru" "AccidentType"`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "kazaYeri" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "insuranceCompanyId" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "policeNo" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "hasInjury" BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "icdCode" TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "vefatVar" BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "aracDegerKaybi" DECIMAL(12, 2)`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "aiMergedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "aiMergeConfidence" DOUBLE PRECISION`,

  // FK Lead.insuranceCompanyId → InsuranceCompany.id (idempotent)
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = 'Lead_insuranceCompanyId_fkey'
     ) THEN
       ALTER TABLE "Lead"
         ADD CONSTRAINT "Lead_insuranceCompanyId_fkey"
         FOREIGN KEY ("insuranceCompanyId")
         REFERENCES "InsuranceCompany"(id)
         ON DELETE SET NULL ON UPDATE CASCADE;
     END IF;
   END $$`,
  `CREATE INDEX IF NOT EXISTS "Lead_insuranceCompanyId_idx" ON "Lead"("insuranceCompanyId")`,
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
