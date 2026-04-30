-- CreateEnum
CREATE TYPE "CareerApplicationStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'HIRED', 'REJECTED', 'DELETED');

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "cvLink" TEXT,
    "message" TEXT,
    "aydinlatmaOnayTimestamp" TIMESTAMP(3) NOT NULL,
    "acikRizaOnayTimestamp" TIMESTAMP(3) NOT NULL,
    "cvHavuzuOnay" BOOLEAN NOT NULL DEFAULT false,
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'NEW',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletionRequestedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerApplication_status_idx" ON "CareerApplication"("status");

-- CreateIndex
CREATE INDEX "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");

-- CreateIndex
CREATE INDEX "CareerApplication_email_idx" ON "CareerApplication"("email");

