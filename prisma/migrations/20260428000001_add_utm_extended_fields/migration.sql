-- AlterTable
ALTER TABLE "Lead"
ADD COLUMN "utmTerm" TEXT,
ADD COLUMN "utmContent" TEXT,
ADD COLUMN "referrer" TEXT,
ADD COLUMN "landingPage" TEXT,
ADD COLUMN "gclid" TEXT;
