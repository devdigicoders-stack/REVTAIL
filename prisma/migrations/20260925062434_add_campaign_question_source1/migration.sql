/*
  Warnings:

  - You are about to drop the column `campaignId` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `questionText` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `questionType` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `campaign_questions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `campaign_questions` table. All the data in the column will be lost.
  - Added the required column `campaign_id` to the `campaign_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_text` to the `campaign_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_type` to the `campaign_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `campaign_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `campaign_questions` DROP FOREIGN KEY `campaign_questions_campaignId_fkey`;

-- DropForeignKey
ALTER TABLE `campaign_questions` DROP FOREIGN KEY `campaign_questions_questionId_fkey`;

-- DropIndex
DROP INDEX `campaign_questions_campaignId_idx` ON `campaign_questions`;

-- DropIndex
DROP INDEX `campaign_questions_isActive_idx` ON `campaign_questions`;

-- DropIndex
DROP INDEX `campaign_questions_questionId_fkey` ON `campaign_questions`;

-- AlterTable
ALTER TABLE `campaign_questions` DROP COLUMN `campaignId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `isRequired`,
    DROP COLUMN `options`,
    DROP COLUMN `questionId`,
    DROP COLUMN `questionText`,
    DROP COLUMN `questionType`,
    DROP COLUMN `sortOrder`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `campaign_id` INTEGER NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_required` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `question_id` INTEGER NULL,
    ADD COLUMN `question_order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `question_text` TEXT NOT NULL,
    ADD COLUMN `question_type` ENUM('TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `campaign_questions_campaign_id_idx` ON `campaign_questions`(`campaign_id`);

-- CreateIndex
CREATE INDEX `campaign_questions_question_id_idx` ON `campaign_questions`(`question_id`);

-- CreateIndex
CREATE INDEX `campaign_questions_source_idx` ON `campaign_questions`(`source`);

-- AddForeignKey
ALTER TABLE `campaign_questions` ADD CONSTRAINT `campaign_questions_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_questions` ADD CONSTRAINT `campaign_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
