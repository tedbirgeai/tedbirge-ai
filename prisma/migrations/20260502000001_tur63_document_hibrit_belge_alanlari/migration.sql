-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'PENDING_UPLOAD';

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_leadId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "category" TEXT,
ADD COLUMN     "compressionRatio" DOUBLE PRECISION,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "originalSize" INTEGER,
ALTER COLUMN "leadId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

