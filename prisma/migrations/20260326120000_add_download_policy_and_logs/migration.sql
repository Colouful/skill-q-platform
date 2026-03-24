-- 下载策略与下载日志；utf8mb3
ALTER TABLE `skills` ADD COLUMN `downloadPolicy` VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE `rules` ADD COLUMN `downloadPolicy` VARCHAR(20) NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS `download_logs` (
    `id` VARCHAR(36) NOT NULL,
    `agentId` VARCHAR(36) NULL,
    `resourceType` VARCHAR(20) NOT NULL,
    `resourceId` VARCHAR(36) NOT NULL,
    `ipAddress` VARCHAR(50) NOT NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `download_logs_agentId_idx`(`agentId`),
    INDEX `download_logs_resourceType_resourceId_idx`(`resourceType`, `resourceId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
