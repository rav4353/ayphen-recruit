/*
  Warnings:

  - Added the required column `tenantId` to the `emails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "emails_tenantId_idx" ON "emails"("tenantId");

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
