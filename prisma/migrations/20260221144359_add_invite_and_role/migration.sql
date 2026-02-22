/*
  Warnings:

  - A unique constraint covering the columns `[linkedUserId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteToken]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[linkedMemberId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "linkedUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "linkedMemberId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OWNER';

-- CreateIndex
CREATE UNIQUE INDEX "Member_linkedUserId_key" ON "Member"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_inviteToken_key" ON "Member"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedMemberId_key" ON "User"("linkedMemberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
