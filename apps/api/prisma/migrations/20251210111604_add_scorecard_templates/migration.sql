/*
  Warnings:

  - A unique constraint covering the columns `[candidateId]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobCode]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "candidateId" TEXT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "durationUnit" TEXT,
ADD COLUMN     "jobCode" TEXT,
ADD COLUMN     "scorecardTemplateId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "scorecard_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "scorecard_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scorecard_templates_tenantId_idx" ON "scorecard_templates"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_candidateId_key" ON "candidates"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_jobCode_key" ON "jobs"("jobCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_scorecardTemplateId_fkey" FOREIGN KEY ("scorecardTemplateId") REFERENCES "scorecard_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecard_templates" ADD CONSTRAINT "scorecard_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_approvals" ADD CONSTRAINT "job_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
