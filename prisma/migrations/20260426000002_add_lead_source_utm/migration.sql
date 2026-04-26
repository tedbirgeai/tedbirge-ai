-- AlterTable
ALTER TABLE "Lead"
ADD COLUMN "source" TEXT,
ADD COLUMN "utmSource" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmCampaign" TEXT;
