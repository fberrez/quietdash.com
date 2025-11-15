/*
  Warnings:

  - You are about to drop the `dashboards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `display_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `widget_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dashboards" DROP CONSTRAINT "dashboards_userId_fkey";

-- DropForeignKey
ALTER TABLE "display_settings" DROP CONSTRAINT "display_settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "widget_configs" DROP CONSTRAINT "widget_configs_dashboardId_fkey";

-- DropTable
DROP TABLE "dashboards";

-- DropTable
DROP TABLE "display_settings";

-- DropTable
DROP TABLE "widget_configs";

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "syncedToResend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_verificationToken_key" ON "waitlist_entries"("verificationToken");
