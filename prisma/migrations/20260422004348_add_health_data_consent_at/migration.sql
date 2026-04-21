-- Migration: add_health_data_consent_at
-- KVKK m.6/3 - special category health data consent timestamp
-- Nullable, no backfill (consent cannot be retroactively assumed)

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "healthDataConsentAt" TIMESTAMP(3);
