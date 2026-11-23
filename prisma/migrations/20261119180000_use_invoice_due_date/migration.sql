DROP INDEX "CreditCardInvoice_creditCardId_billingMonth_key";

ALTER TABLE "CreditCardInvoice"
ALTER COLUMN "billingMonth" DROP NOT NULL;
