-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('BEKLIYOR', 'HESAPLANDI', 'HAVALE_EDILDI', 'IPTAL');

-- CreateTable
CREATE TABLE "CommissionLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tahsilatBrut" DECIMAL(12,2) NOT NULL,
    "tedbirgeOrani" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "tedbirgeNet" DECIMAL(12,2) NOT NULL,
    "temsilciId" TEXT,
    "temsilciNet" DECIMAL(12,2),
    "durum" "CommissionStatus" NOT NULL DEFAULT 'BEKLIYOR',
    "havaleAt" TIMESTAMP(3),
    "havaleReferans" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionLog_leadId_idx" ON "CommissionLog"("leadId");

-- CreateIndex
CREATE INDEX "CommissionLog_temsilciId_idx" ON "CommissionLog"("temsilciId");

-- CreateIndex
CREATE INDEX "CommissionLog_durum_idx" ON "CommissionLog"("durum");

-- CreateIndex
CREATE INDEX "CommissionLog_createdAt_idx" ON "CommissionLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

-- AddForeignKey
ALTER TABLE "CommissionLog" ADD CONSTRAINT "CommissionLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLog" ADD CONSTRAINT "CommissionLog_temsilciId_fkey" FOREIGN KEY ("temsilciId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

