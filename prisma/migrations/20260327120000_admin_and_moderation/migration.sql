-- 管理员、会话与内容审核字段；utf8mb3
-- 幂等：兼容 MySQL 5.7+（不用 ADD COLUMN IF NOT EXISTS），通过 information_schema 判断

CREATE TABLE IF NOT EXISTS `admins` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'moderator',
    `permissions` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(64) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `admin_sessions_sessionId_key`(`sessionId`),
    INDEX `admin_sessions_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @db := DATABASE();

-- skills.moderationStatus
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = @db AND table_name = 'skills' AND column_name = 'moderationStatus') > 0,
    'SELECT 1',
    'ALTER TABLE `skills` ADD COLUMN `moderationStatus` VARCHAR(20) NOT NULL DEFAULT ''published'''
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- skills.moderationNote
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = @db AND table_name = 'skills' AND column_name = 'moderationNote') > 0,
    'SELECT 1',
    'ALTER TABLE `skills` ADD COLUMN `moderationNote` TEXT NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- rules.moderationStatus
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = @db AND table_name = 'rules' AND column_name = 'moderationStatus') > 0,
    'SELECT 1',
    'ALTER TABLE `rules` ADD COLUMN `moderationStatus` VARCHAR(20) NOT NULL DEFAULT ''published'''
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- rules.moderationNote
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = @db AND table_name = 'rules' AND column_name = 'moderationNote') > 0,
    'SELECT 1',
    'ALTER TABLE `rules` ADD COLUMN `moderationNote` TEXT NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 索引
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = @db AND table_name = 'skills' AND index_name = 'skills_moderationStatus_idx') = 0,
    'CREATE INDEX `skills_moderationStatus_idx` ON `skills`(`moderationStatus`)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = @db AND table_name = 'rules' AND index_name = 'rules_moderationStatus_idx') = 0,
    'CREATE INDEX `rules_moderationStatus_idx` ON `rules`(`moderationStatus`)',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
