CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditCardInvoice" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCardInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditCard_accountId_key" ON "CreditCard"("accountId");
CREATE INDEX "CreditCard_userId_idx" ON "CreditCard"("userId");
CREATE UNIQUE INDEX "CreditCardInvoice_creditCardId_billingMonth_key" ON "CreditCardInvoice"("creditCardId", "billingMonth");

ALTER TABLE "CreditCard"
ADD CONSTRAINT "CreditCard_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditCard"
ADD CONSTRAINT "CreditCard_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditCardInvoice"
ADD CONSTRAINT "CreditCardInvoice_creditCardId_fkey"
FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
