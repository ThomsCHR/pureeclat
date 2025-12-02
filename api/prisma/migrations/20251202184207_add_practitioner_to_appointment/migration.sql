/*
  Warnings:

  - Added the required column `practitionerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ESTHETICIENNE';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "practitionerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
