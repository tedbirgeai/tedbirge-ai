-- CreateEnum
CREATE TYPE "AiAnalizOnay" AS ENUM ('BEKLIYOR', 'ONAYLI', 'REDDEDILDI', 'GEREKLI_DEGIL');

-- CreateEnum
CREATE TYPE "AciliyetSeviye" AS ENUM ('DUSUK', 'NORMAL', 'ACIL', 'KRITIK');

-- CreateEnum
CREATE TYPE "AgentEventSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aciliyet" "AciliyetSeviye" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "aiAnalizOnay" "AiAnalizOnay",
ADD COLUMN     "aiAnalizOnayAt" TIMESTAMP(3),
ADD COLUMN     "aiAnalizOnayBy" TEXT,
ADD COLUMN     "aiAnalizOnayNote" TEXT,
ADD COLUMN     "publicSummary" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "iban" TEXT,
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "vergiDairesi" TEXT,
ADD COLUMN     "vergiKimlikNo" TEXT;

-- CreateTable
CREATE TABLE "AgentEvent" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" "AgentEventSeverity" NOT NULL DEFAULT 'INFO',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeEvent" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RealtimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentEvent_agentName_createdAt_idx" ON "AgentEvent"("agentName", "createdAt");

-- CreateIndex
CREATE INDEX "AgentEvent_severity_idx" ON "AgentEvent"("severity");

-- CreateIndex
CREATE INDEX "AgentEvent_createdAt_idx" ON "AgentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RealtimeEvent_channel_createdAt_idx" ON "RealtimeEvent"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "RealtimeEvent_userId_consumed_idx" ON "RealtimeEvent"("userId", "consumed");

-- AddForeignKey
ALTER TABLE "RealtimeEvent" ADD CONSTRAINT "RealtimeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

