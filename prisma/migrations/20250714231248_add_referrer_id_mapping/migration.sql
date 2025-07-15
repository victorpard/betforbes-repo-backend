/*
  Warnings:

  - Made the column `referralCode` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('LEVERAGE_FEE', 'PROFIT_FEE', 'WITHDRAWAL_FEE');

-- AlterTable
ALTER TABLE "system_config" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "referralCode" SET NOT NULL,
ALTER COLUMN "referralCode" SET DEFAULT (substr(md5(gen_random_uuid()::text), 1, 8));

-- CreateTable
CREATE TABLE "revenue_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RevenueType" NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_events" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "revenueEventId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_revenueEventId_fkey" FOREIGN KEY ("revenueEventId") REFERENCES "revenue_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
