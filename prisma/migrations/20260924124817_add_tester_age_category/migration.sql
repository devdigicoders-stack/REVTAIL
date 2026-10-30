/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `tester_profiles` table. All the data in the column will be lost.
  - Added the required column `ageCategory` to the `tester_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tester_profiles` DROP COLUMN `dateOfBirth`,
    ADD COLUMN `ageCategory` ENUM('AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_PLUS') NOT NULL;

-- CreateIndex
CREATE INDEX `tester_profiles_gender_idx` ON `tester_profiles`(`gender`);

-- CreateIndex
CREATE INDEX `tester_profiles_ageCategory_idx` ON `tester_profiles`(`ageCategory`);

-- CreateIndex
CREATE INDEX `tester_profiles_approvalStatus_idx` ON `tester_profiles`(`approvalStatus`);

-- CreateIndex
CREATE INDEX `tester_profiles_pinCode_idx` ON `tester_profiles`(`pinCode`);
