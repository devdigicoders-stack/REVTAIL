/*
  Warnings:

  - Made the column `category_id` on table `brand_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `brand_profiles` DROP FOREIGN KEY `brand_profiles_category_id_fkey`;

-- DropIndex
DROP INDEX `brand_profiles_category_id_fkey` ON `brand_profiles`;

-- AlterTable
ALTER TABLE `brand_profiles` MODIFY `category_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `campaign_invitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `tester_profile_id` INTEGER NOT NULL,
    `invited_by` INTEGER NOT NULL,
    `status` ENUM('SENT', 'CANCELLED') NOT NULL DEFAULT 'SENT',
    `invited_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `campaign_invitations_campaign_id_idx`(`campaign_id`),
    INDEX `campaign_invitations_tester_profile_id_idx`(`tester_profile_id`),
    INDEX `campaign_invitations_invited_by_idx`(`invited_by`),
    INDEX `campaign_invitations_status_idx`(`status`),
    UNIQUE INDEX `campaign_invitations_campaign_id_tester_profile_id_key`(`campaign_id`, `tester_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `interests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_invitations` ADD CONSTRAINT `campaign_invitations_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_invitations` ADD CONSTRAINT `campaign_invitations_tester_profile_id_fkey` FOREIGN KEY (`tester_profile_id`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_invitations` ADD CONSTRAINT `campaign_invitations_invited_by_fkey` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
