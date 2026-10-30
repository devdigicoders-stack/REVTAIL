-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('ADMIN', 'BRAND', 'TESTER') NOT NULL,
    `email` VARCHAR(191) NULL,
    `mobile` VARCHAR(20) NULL,
    `password` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `emailVerifiedAt` DATETIME(3) NULL,
    `mobileVerifiedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_mobile_key`(`mobile`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `companyName` VARCHAR(150) NOT NULL,
    `companyType` VARCHAR(100) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `website` VARCHAR(255) NULL,
    `pocFullName` VARCHAR(100) NULL,
    `pocMobile` VARCHAR(20) NULL,
    `designation` VARCHAR(100) NULL,
    `approvalStatus` ENUM('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `brand_profiles_userId_key`(`userId`),
    INDEX `brand_profiles_companyName_idx`(`companyName`),
    INDEX `brand_profiles_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `designation` VARCHAR(100) NULL,
    `profileImage` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand_id` INTEGER NOT NULL,
    `campaign_code` VARCHAR(50) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_image` VARCHAR(500) NULL,
    `product_link` VARCHAR(500) NULL,
    `product_description` TEXT NULL,
    `earning_amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `total_slots` INTEGER NOT NULL,
    `filled_slots` INTEGER NOT NULL DEFAULT 0,
    `available_slots` INTEGER NULL,
    `target_gender` ENUM('MALE', 'FEMALE', 'ANY') NOT NULL DEFAULT 'ANY',
    `target_state` VARCHAR(100) NULL,
    `target_city` VARCHAR(100) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `task_4_required` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `submitted_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_at` DATETIME(3) NULL,
    `approved_by` INTEGER NULL,
    `rejection_reason` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campaigns_campaign_code_key`(`campaign_code`),
    INDEX `campaigns_brand_id_idx`(`brand_id`),
    INDEX `campaigns_created_by_idx`(`created_by`),
    INDEX `campaigns_approved_by_idx`(`approved_by`),
    INDEX `campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_text` TEXT NOT NULL,
    `question_type` ENUM('TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `source` ENUM('FIXED', 'CUSTOM') NOT NULL DEFAULT 'FIXED',
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `questions_created_by_idx`(`created_by`),
    INDEX `questions_question_type_idx`(`question_type`),
    INDEX `questions_source_idx`(`source`),
    INDEX `questions_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_id` INTEGER NOT NULL,
    `option_text` VARCHAR(500) NOT NULL,
    `option_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `question_options_question_id_idx`(`question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `questionText` TEXT NOT NULL,
    `questionType` ENUM('TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING') NOT NULL DEFAULT 'TEXT',
    `options` JSON NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `questionId` INTEGER NULL,

    INDEX `campaign_questions_campaignId_idx`(`campaignId`),
    INDEX `campaign_questions_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `image_path` VARCHAR(500) NOT NULL,
    `image_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campaign_images_campaign_id_idx`(`campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetOtp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `otp_hash` VARCHAR(191) NOT NULL,
    `reset_token` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetOtp_reset_token_key`(`reset_token`),
    INDEX `PasswordResetOtp_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `interests_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `pinCode` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `profileImage` VARCHAR(191) NULL,
    `instagramId` VARCHAR(191) NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `tester_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_interests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `interestId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tester_interests_testerProfileId_idx`(`testerProfileId`),
    INDEX `tester_interests_interestId_idx`(`interestId`),
    UNIQUE INDEX `tester_interests_testerProfileId_interestId_key`(`testerProfileId`, `interestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_bank_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountNumberLast4` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `upiId` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tester_bank_details_testerProfileId_key`(`testerProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `campaignId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` INTEGER NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaign_applications_testerProfileId_idx`(`testerProfileId`),
    INDEX `campaign_applications_campaignId_idx`(`campaignId`),
    INDEX `campaign_applications_status_idx`(`status`),
    UNIQUE INDEX `campaign_applications_testerProfileId_campaignId_key`(`testerProfileId`, `campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pin_code_master` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pinCode` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pin_code_master_pinCode_idx`(`pinCode`),
    INDEX `pin_code_master_state_idx`(`state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `campaignId` INTEGER NOT NULL,
    `applicationId` INTEGER NOT NULL,
    `status` ENUM('ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ONGOING',
    `currentTask` INTEGER NOT NULL DEFAULT 1,
    `earningAmount` DECIMAL(10, 2) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tester_campaigns_applicationId_key`(`applicationId`),
    INDEX `tester_campaigns_testerProfileId_idx`(`testerProfileId`),
    INDEX `tester_campaigns_campaignId_idx`(`campaignId`),
    INDEX `tester_campaigns_status_idx`(`status`),
    UNIQUE INDEX `tester_campaigns_testerProfileId_campaignId_key`(`testerProfileId`, `campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_campaign_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerCampaignId` INTEGER NOT NULL,
    `taskNumber` INTEGER NOT NULL,
    `status` ENUM('LOCKED', 'AVAILABLE', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'LOCKED',
    `unlockedAt` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `reviewedBy` INTEGER NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tester_campaign_tasks_testerCampaignId_idx`(`testerCampaignId`),
    INDEX `tester_campaign_tasks_status_idx`(`status`),
    UNIQUE INDEX `tester_campaign_tasks_testerCampaignId_taskNumber_key`(`testerCampaignId`, `taskNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_task_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerCampaignTaskId` INTEGER NOT NULL,
    `attemptNumber` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedBy` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tester_task_submissions_testerCampaignTaskId_idx`(`testerCampaignTaskId`),
    INDEX `tester_task_submissions_status_idx`(`status`),
    UNIQUE INDEX `tester_task_submissions_testerCampaignTaskId_attemptNumber_key`(`testerCampaignTaskId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task1_purchase_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskSubmissionId` INTEGER NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `purchaseAmount` DECIMAL(10, 2) NOT NULL,
    `proofImage` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `task1_purchase_details_taskSubmissionId_key`(`taskSubmissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task2_received_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskSubmissionId` INTEGER NOT NULL,
    `proofImage` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `task2_received_details_taskSubmissionId_key`(`taskSubmissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task3_review_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskSubmissionId` INTEGER NOT NULL,
    `reviewText` TEXT NOT NULL,
    `rating` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `task3_review_details_taskSubmissionId_key`(`taskSubmissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_question_answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task3ReviewDetailId` INTEGER NOT NULL,
    `campaignQuestionId` INTEGER NOT NULL,
    `answerText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tester_question_answers_task3ReviewDetailId_idx`(`task3ReviewDetailId`),
    INDEX `tester_question_answers_campaignQuestionId_idx`(`campaignQuestionId`),
    UNIQUE INDEX `tester_question_answers_task3ReviewDetailId_campaignQuestion_key`(`task3ReviewDetailId`, `campaignQuestionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task4_publish_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskSubmissionId` INTEGER NOT NULL,
    `publishedUrl` TEXT NOT NULL,
    `proofImage` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `task4_publish_details_taskSubmissionId_key`(`taskSubmissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tester_wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `totalEarned` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `availableBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tester_wallets_testerProfileId_key`(`testerProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testerProfileId` INTEGER NOT NULL,
    `testerCampaignId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `preferredPaymentMethod` ENUM('UPI', 'BANK_TRANSFER') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'PENDING',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` INTEGER NULL,
    `rejectionReason` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `paidBy` INTEGER NULL,
    `paidAmount` DECIMAL(10, 2) NULL,
    `paidMethod` ENUM('UPI', 'BANK_TRANSFER') NULL,
    `transactionReference` VARCHAR(191) NULL,
    `adminNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_requests_testerCampaignId_key`(`testerCampaignId`),
    INDEX `payment_requests_testerProfileId_idx`(`testerProfileId`),
    INDEX `payment_requests_status_idx`(`status`),
    INDEX `payment_requests_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `walletId` INTEGER NOT NULL,
    `testerCampaignId` INTEGER NULL,
    `paymentRequestId` INTEGER NULL,
    `type` ENUM('CAMPAIGN_EARNING', 'PAYMENT_PAID') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balanceAfter` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wallet_transactions_walletId_idx`(`walletId`),
    INDEX `wallet_transactions_testerCampaignId_idx`(`testerCampaignId`),
    INDEX `wallet_transactions_paymentRequestId_idx`(`paymentRequestId`),
    INDEX `wallet_transactions_type_idx`(`type`),
    INDEX `wallet_transactions_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `wallet_transactions_walletId_testerCampaignId_type_key`(`walletId`, `testerCampaignId`, `type`),
    UNIQUE INDEX `wallet_transactions_walletId_paymentRequestId_type_key`(`walletId`, `paymentRequestId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_profiles` ADD CONSTRAINT `admin_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brand_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_questions` ADD CONSTRAINT `campaign_questions_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_questions` ADD CONSTRAINT `campaign_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_images` ADD CONSTRAINT `campaign_images_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetOtp` ADD CONSTRAINT `PasswordResetOtp_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_profiles` ADD CONSTRAINT `tester_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_interests` ADD CONSTRAINT `tester_interests_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_interests` ADD CONSTRAINT `tester_interests_interestId_fkey` FOREIGN KEY (`interestId`) REFERENCES `interests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_bank_details` ADD CONSTRAINT `tester_bank_details_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_applications` ADD CONSTRAINT `campaign_applications_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_applications` ADD CONSTRAINT `campaign_applications_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_applications` ADD CONSTRAINT `campaign_applications_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_campaigns` ADD CONSTRAINT `tester_campaigns_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_campaigns` ADD CONSTRAINT `tester_campaigns_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_campaigns` ADD CONSTRAINT `tester_campaigns_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `campaign_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_campaign_tasks` ADD CONSTRAINT `tester_campaign_tasks_testerCampaignId_fkey` FOREIGN KEY (`testerCampaignId`) REFERENCES `tester_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_campaign_tasks` ADD CONSTRAINT `tester_campaign_tasks_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_task_submissions` ADD CONSTRAINT `tester_task_submissions_testerCampaignTaskId_fkey` FOREIGN KEY (`testerCampaignTaskId`) REFERENCES `tester_campaign_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_task_submissions` ADD CONSTRAINT `tester_task_submissions_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task1_purchase_details` ADD CONSTRAINT `task1_purchase_details_taskSubmissionId_fkey` FOREIGN KEY (`taskSubmissionId`) REFERENCES `tester_task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task2_received_details` ADD CONSTRAINT `task2_received_details_taskSubmissionId_fkey` FOREIGN KEY (`taskSubmissionId`) REFERENCES `tester_task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task3_review_details` ADD CONSTRAINT `task3_review_details_taskSubmissionId_fkey` FOREIGN KEY (`taskSubmissionId`) REFERENCES `tester_task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_question_answers` ADD CONSTRAINT `tester_question_answers_task3ReviewDetailId_fkey` FOREIGN KEY (`task3ReviewDetailId`) REFERENCES `task3_review_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_question_answers` ADD CONSTRAINT `tester_question_answers_campaignQuestionId_fkey` FOREIGN KEY (`campaignQuestionId`) REFERENCES `campaign_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task4_publish_details` ADD CONSTRAINT `task4_publish_details_taskSubmissionId_fkey` FOREIGN KEY (`taskSubmissionId`) REFERENCES `tester_task_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tester_wallets` ADD CONSTRAINT `tester_wallets_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_testerProfileId_fkey` FOREIGN KEY (`testerProfileId`) REFERENCES `tester_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_testerCampaignId_fkey` FOREIGN KEY (`testerCampaignId`) REFERENCES `tester_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_paidBy_fkey` FOREIGN KEY (`paidBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `tester_wallets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_testerCampaignId_fkey` FOREIGN KEY (`testerCampaignId`) REFERENCES `tester_campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_paymentRequestId_fkey` FOREIGN KEY (`paymentRequestId`) REFERENCES `payment_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
