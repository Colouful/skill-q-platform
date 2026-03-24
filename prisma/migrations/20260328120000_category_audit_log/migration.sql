-- 分类操作审计；utf8mb3
CREATE TABLE IF NOT EXISTS `category_audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `adminId` VARCHAR(36) NOT NULL,
    `action` VARCHAR(40) NOT NULL,
    `categoryId` VARCHAR(36) NULL,
    `details` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `category_audit_logs_adminId_idx`(`adminId`),
    INDEX `category_audit_logs_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
