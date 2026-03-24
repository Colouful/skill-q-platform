-- AgentHub：替换 markView 表结构；utf8mb3
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `projects`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(255) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`),
  UNIQUE KEY `categories_slug_key` (`slug`),
  KEY `categories_slug_idx` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `skills` (
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
  `forkedFromSkillId` VARCHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_slug_key` (`slug`),
  KEY `skills_categoryId_idx` (`categoryId`),
  KEY `skills_slug_idx` (`slug`),
  KEY `skills_downloads_idx` (`downloads`),
  KEY `skills_rating_idx` (`rating`),
  CONSTRAINT `skills_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `versions` (
  `id` VARCHAR(36) NOT NULL,
  `version` VARCHAR(20) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `changelog` TEXT NULL,
  `files` JSON NOT NULL,
  `downloadUrl` VARCHAR(500) NULL,
  `isLatest` BOOLEAN NOT NULL DEFAULT false,
  `downloads` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `versions_skillId_version_key` (`skillId`, `version`),
  KEY `versions_skillId_idx` (`skillId`),
  CONSTRAINT `versions_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `content` TEXT NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `isHelpful` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_skillId_idx` (`skillId`),
  CONSTRAINT `reviews_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
