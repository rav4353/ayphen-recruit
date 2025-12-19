-- AlterTable
ALTER TABLE "scorecard_templates" ADD COLUMN     "ratingLabelMax" TEXT DEFAULT 'Excellent',
ADD COLUMN     "ratingLabelMin" TEXT DEFAULT 'Poor',
ADD COLUMN     "ratingScale" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "recommendationOptions" JSONB;
