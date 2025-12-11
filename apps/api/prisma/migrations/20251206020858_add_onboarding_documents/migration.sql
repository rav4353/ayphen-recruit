-- CreateEnum
CREATE TYPE "OnboardingDocumentStatus" AS ENUM ('NOT_UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "onboarding_tasks" ADD COLUMN     "documentStatus" "OnboardingDocumentStatus" NOT NULL DEFAULT 'NOT_UPLOADED',
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "isRequiredDoc" BOOLEAN NOT NULL DEFAULT false;
