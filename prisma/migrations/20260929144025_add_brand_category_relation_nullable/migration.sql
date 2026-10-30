/*
  Warnings:

  - You are about to drop the column `category` on the `brand_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `brand_profiles` DROP COLUMN `category`,
    ADD COLUMN `category_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `campaigns` ALTER COLUMN `marketplace` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `interests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
