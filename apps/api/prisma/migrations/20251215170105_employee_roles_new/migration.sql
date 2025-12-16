/*
  Warnings:

  - You are about to drop the column `esignatureEnvelopeId` on the `offers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BGVProvider" AS ENUM ('CHECKR', 'SPRINGVERIFY', 'AUTHBRIDGE', 'MANUAL');

-- CreateEnum
CREATE TYPE "BGVStatus" AS ENUM ('PENDING', 'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CLEAR', 'CONSIDER', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BGVCheckType" AS ENUM ('IDENTITY', 'CRIMINAL', 'EDUCATION', 'EMPLOYMENT', 'CREDIT', 'DRUG_TEST', 'REFERENCE', 'ADDRESS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION', 'INTERVIEW', 'OFFER', 'JOB', 'SLA', 'APPROVAL', 'ONBOARDING', 'BGV', 'SYSTEM', 'MESSAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'HR';
ALTER TYPE "UserRole" ADD VALUE 'EMPLOYEE';

-- AlterTable
ALTER TABLE "offers" DROP COLUMN "esignatureEnvelopeId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tempPasswordExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bgv_checks" (
    "id" TEXT NOT NULL,
    "provider" "BGVProvider" NOT NULL,
    "externalId" TEXT,
    "status" "BGVStatus" NOT NULL DEFAULT 'PENDING',
    "packageType" TEXT,
    "checkTypes" "BGVCheckType"[],
    "reportUrl" TEXT,
    "result" JSONB,
    "discrepancies" JSONB,
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "candidateId" TEXT NOT NULL,
    "applicationId" TEXT,
    "initiatedById" TEXT,

    CONSTRAINT "bgv_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bgv_settings" (
    "id" TEXT NOT NULL,
    "provider" "BGVProvider" NOT NULL DEFAULT 'CHECKR',
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookUrl" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "bgv_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "newApplication" BOOLEAN NOT NULL DEFAULT true,
    "applicationStageChange" BOOLEAN NOT NULL DEFAULT true,
    "interviewScheduled" BOOLEAN NOT NULL DEFAULT true,
    "interviewReminder" BOOLEAN NOT NULL DEFAULT true,
    "interviewFeedback" BOOLEAN NOT NULL DEFAULT true,
    "offerCreated" BOOLEAN NOT NULL DEFAULT true,
    "offerApproval" BOOLEAN NOT NULL DEFAULT true,
    "offerAccepted" BOOLEAN NOT NULL DEFAULT true,
    "offerDeclined" BOOLEAN NOT NULL DEFAULT true,
    "jobApproval" BOOLEAN NOT NULL DEFAULT true,
    "jobPublished" BOOLEAN NOT NULL DEFAULT true,
    "slaAtRisk" BOOLEAN NOT NULL DEFAULT true,
    "slaOverdue" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequests" BOOLEAN NOT NULL DEFAULT true,
    "onboardingUpdates" BOOLEAN NOT NULL DEFAULT true,
    "bgvUpdates" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bgv_checks_candidateId_idx" ON "bgv_checks"("candidateId");

-- CreateIndex
CREATE INDEX "bgv_checks_applicationId_idx" ON "bgv_checks"("applicationId");

-- CreateIndex
CREATE INDEX "bgv_checks_status_idx" ON "bgv_checks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bgv_settings_tenantId_key" ON "bgv_settings"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "offer_approvals" ADD CONSTRAINT "offer_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bgv_checks" ADD CONSTRAINT "bgv_checks_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bgv_checks" ADD CONSTRAINT "bgv_checks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bgv_checks" ADD CONSTRAINT "bgv_checks_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bgv_settings" ADD CONSTRAINT "bgv_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
