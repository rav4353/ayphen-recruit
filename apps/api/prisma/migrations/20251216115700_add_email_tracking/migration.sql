-- AlterTable
ALTER TABLE "scorecard_templates" ADD COLUMN     "ratingLabelMax" TEXT DEFAULT 'Excellent',
ADD COLUMN     "ratingLabelMin" TEXT DEFAULT 'Poor',
ADD COLUMN     "ratingScale" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "recommendationOptions" JSONB;

-- AddForeignKey
ALTER TABLE "email_tracking_events" ADD CONSTRAINT "email_tracking_events_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
