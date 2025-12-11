/*
  Warnings:

  - You are about to drop the column `reminder1hSent` on the `interviews` table. All the data in the column will be lost.
  - You are about to drop the column `reminder24hSent` on the `interviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `offers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "interviews" DROP COLUMN "reminder1hSent",
DROP COLUMN "reminder24hSent",
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "content" TEXT,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "token" TEXT;

-- CreateTable
CREATE TABLE "offer_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "offer_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_templates_tenantId_idx" ON "offer_templates"("tenantId");

-- CreateIndex
CREATE INDEX "availability_slots_userId_idx" ON "availability_slots"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "offers_token_key" ON "offers"("token");

-- AddForeignKey
ALTER TABLE "offer_templates" ADD CONSTRAINT "offer_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "offer_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
