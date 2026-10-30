-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `marketplace` ENUM('Amazon', 'Ajio', 'Flipkart', 'Myntra', 'Meesho', 'Blinkit', 'Zepto', 'Bigbasket', 'SwiggyInstamart', 'BrandWebsite', 'Other') NOT NULL DEFAULT 'Other';
