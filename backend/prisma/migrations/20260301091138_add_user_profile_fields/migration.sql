/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "className" TEXT;
ALTER TABLE "users" ADD COLUMN "enrollmentYear" TEXT;
ALTER TABLE "users" ADD COLUMN "nickname" TEXT;
ALTER TABLE "users" ADD COLUMN "politicalStatus" TEXT;
ALTER TABLE "users" ADD COLUMN "qq" TEXT;
ALTER TABLE "users" ADD COLUMN "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");
