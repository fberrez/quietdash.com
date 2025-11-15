/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `waitlist_entries` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "waitlist_entries" ADD COLUMN     "queuePosition" INTEGER,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_referralCode_key" ON "waitlist_entries"("referralCode");
