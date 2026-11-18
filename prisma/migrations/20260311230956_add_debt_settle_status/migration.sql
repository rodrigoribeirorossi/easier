-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
