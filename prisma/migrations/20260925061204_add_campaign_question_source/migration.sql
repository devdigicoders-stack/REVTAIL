-- AlterTable
ALTER TABLE `campaign_questions` ADD COLUMN `source` ENUM('FIXED', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM';
