-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentOccurrence" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOccurrence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentOccurrence" ADD CONSTRAINT "PaymentOccurrence_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
