CREATE TABLE `hub_audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `targetType` VARCHAR(80) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `targetSlug` VARCHAR(191) NULL,
  `targetVersion` VARCHAR(80) NULL,
  `action` VARCHAR(80) NOT NULL,
  `statusFrom` VARCHAR(80) NULL,
  `statusTo` VARCHAR(80) NULL,
  `operatorId` VARCHAR(191) NULL,
  `operatorName` VARCHAR(191) NULL,
  `operatorType` VARCHAR(80) NULL,
  `reason` TEXT NULL,
  `note` TEXT NULL,
  `metadata` JSON NULL,
  `requestId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `hub_audit_log_targetType_targetId_createdAt_idx` ON `hub_audit_log`(`targetType`, `targetId`, `createdAt`);
CREATE INDEX `hub_audit_log_action_createdAt_idx` ON `hub_audit_log`(`action`, `createdAt`);
CREATE INDEX `hub_audit_log_operatorId_createdAt_idx` ON `hub_audit_log`(`operatorId`, `createdAt`);
CREATE INDEX `hub_audit_log_createdAt_idx` ON `hub_audit_log`(`createdAt`);
