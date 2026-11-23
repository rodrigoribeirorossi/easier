DROP INDEX "CreditCardInvoice_creditCardId_billingMonth_key";

ALTER TABLE "CreditCardInvoice"
DROP COLUMN "billingMonth";
