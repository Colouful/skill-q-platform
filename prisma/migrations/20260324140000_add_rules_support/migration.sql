-- AgentHub 双轨：Category 扩展、Rule / RuleVersion、Review 多资源（utf8mb3）

-- 1) categories：resourceType + 复合唯一
ALTER TABLE `categories` ADD COLUMN `resourceType` VARCHAR(20) NOT NULL DEFAULT 'skill';
ALTER TABLE `categories` DROP INDEX `categories_name_key`;
ALTER TABLE `categories` DROP INDEX `categories_slug_key`;
ALTER TABLE `categories` DROP INDEX `categories_slug_idx`;
CREATE UNIQUE INDEX `categories_slug_resourceType_key` ON `categories`(`slug`, `resourceType`);
CREATE UNIQUE INDEX `categories_name_resourceType_key` ON `categories`(`name`, `resourceType`);

-- 2) rules / rule_versions
CREATE TABLE `rules` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `longDescription` TEXT NULL,
  `author` VARCHAR(100) NOT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `downloads` INT NOT NULL DEFAULT 0,
  `rating` DOUBLE NOT NULL DEFAULT 0,
  `reviewCount` INT NOT NULL DEFAULT 0,
  `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  `tags` JSON NULL,
  `forkedFromRuleId` VARCHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rules_slug_key` (`slug`),
  KEY `rules_categoryId_idx` (`categoryId`),
  KEY `rules_slug_idx` (`slug`),
  KEY `rules_author_idx` (`author`),
  KEY `rules_downloads_idx` (`downloads`),
  KEY `rules_rating_idx` (`rating`),
  CONSTRAINT `rules_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `rule_versions` (
  `id` VARCHAR(36) NOT NULL,
  `version` VARCHAR(20) NOT NULL,
  `ruleId` VARCHAR(36) NOT NULL,
  `changelog` TEXT NULL,
  `files` JSON NOT NULL,
  `downloadUrl` VARCHAR(500) NULL,
  `isLatest` BOOLEAN NOT NULL DEFAULT false,
  `downloads` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_versions_ruleId_version_key` (`ruleId`, `version`),
  KEY `rule_versions_ruleId_idx` (`ruleId`),
  CONSTRAINT `rule_versions_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 3) reviews：多资源字段，skillId 可空
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_skillId_fkey`;

ALTER TABLE `reviews` ADD COLUMN `resourceType` VARCHAR(20) NOT NULL DEFAULT 'skill';
ALTER TABLE `reviews` ADD COLUMN `resourceId` VARCHAR(36) NULL;
UPDATE `reviews` SET `resourceId` = `skillId` WHERE `resourceId` IS NULL;
ALTER TABLE `reviews` MODIFY `resourceId` VARCHAR(36) NOT NULL;

ALTER TABLE `reviews` ADD COLUMN `ruleId` VARCHAR(36) NULL;
ALTER TABLE `reviews` MODIFY `skillId` VARCHAR(36) NULL;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX `reviews_resourceType_resourceId_idx` ON `reviews`(`resourceType`, `resourceId`);
