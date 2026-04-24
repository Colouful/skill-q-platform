CREATE TABLE IF NOT EXISTS `hub_asset` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(128) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `displayName` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `ownerId` VARCHAR(128) NULL,
  `teamId` VARCHAR(128) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `riskLevel` VARCHAR(8) NOT NULL DEFAULT 'L0',
  `tags` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_asset_assetId_key` (`assetId`),
  KEY `hub_asset_kind_idx` (`kind`),
  KEY `hub_asset_status_idx` (`status`),
  KEY `hub_asset_riskLevel_idx` (`riskLevel`)
);

CREATE TABLE IF NOT EXISTS `hub_asset_version` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(128) NOT NULL,
  `version` VARCHAR(64) NOT NULL,
  `content` LONGTEXT NULL,
  `contentFormat` VARCHAR(32) NOT NULL DEFAULT 'markdown',
  `checksum` VARCHAR(128) NOT NULL,
  `changelog` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `contentUrl` VARCHAR(500) NULL,
  `createdBy` VARCHAR(128) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `publishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_asset_version_assetId_version_key` (`assetId`, `version`),
  KEY `hub_asset_version_assetId_idx` (`assetId`),
  KEY `hub_asset_version_status_idx` (`status`),
  CONSTRAINT `hub_asset_version_assetId_fkey`
    FOREIGN KEY (`assetId`) REFERENCES `hub_asset` (`assetId`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `hub_manifest` (
  `id` VARCHAR(36) NOT NULL,
  `manifestId` VARCHAR(128) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `displayName` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `techStacks` JSON NULL,
  `ides` JSON NULL,
  `scenarios` JSON NULL,
  `tags` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_manifest_manifestId_key` (`manifestId`),
  KEY `hub_manifest_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `hub_manifest_version` (
  `id` VARCHAR(36) NOT NULL,
  `manifestId` VARCHAR(128) NOT NULL,
  `version` VARCHAR(64) NOT NULL,
  `checksum` VARCHAR(128) NOT NULL,
  `installPolicy` JSON NOT NULL,
  `compatibility` JSON NOT NULL,
  `exportSnapshot` JSON NOT NULL,
  `releaseNote` TEXT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `publishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_manifest_version_manifestId_version_key` (`manifestId`, `version`),
  KEY `hub_manifest_version_manifestId_idx` (`manifestId`),
  KEY `hub_manifest_version_status_idx` (`status`),
  CONSTRAINT `hub_manifest_version_manifestId_fkey`
    FOREIGN KEY (`manifestId`) REFERENCES `hub_manifest` (`manifestId`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `hub_manifest_asset` (
  `id` VARCHAR(36) NOT NULL,
  `manifestId` VARCHAR(128) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `assetId` VARCHAR(128) NOT NULL,
  `version` VARCHAR(64) NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT TRUE,
  `installPath` VARCHAR(500) NULL,
  `checksum` VARCHAR(128) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `config` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_manifest_asset_manifestId_kind_assetId_version_key` (`manifestId`, `kind`, `assetId`, `version`),
  KEY `hub_manifest_asset_manifestId_idx` (`manifestId`),
  KEY `hub_manifest_asset_assetId_idx` (`assetId`),
  CONSTRAINT `hub_manifest_asset_manifestId_fkey`
    FOREIGN KEY (`manifestId`) REFERENCES `hub_manifest` (`manifestId`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `hub_asset_audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `actorId` VARCHAR(128) NULL,
  `action` VARCHAR(40) NOT NULL,
  `resourceType` VARCHAR(32) NOT NULL,
  `resourceId` VARCHAR(128) NOT NULL,
  `details` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hub_asset_audit_log_resourceType_resourceId_idx` (`resourceType`, `resourceId`),
  KEY `hub_asset_audit_log_action_idx` (`action`)
);

CREATE TABLE IF NOT EXISTS `hub_install_record` (
  `id` VARCHAR(36) NOT NULL,
  `projectName` VARCHAR(255) NOT NULL,
  `repoUrl` VARCHAR(500) NULL,
  `manifestId` VARCHAR(128) NOT NULL,
  `manifestVersion` VARCHAR(64) NOT NULL,
  `installMode` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `assets` JSON NOT NULL,
  `message` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hub_install_record_projectName_idx` (`projectName`),
  KEY `hub_install_record_manifestId_manifestVersion_idx` (`manifestId`, `manifestVersion`)
);

CREATE TABLE IF NOT EXISTS `hub_runtime_report` (
  `id` VARCHAR(36) NOT NULL,
  `projectName` VARCHAR(255) NOT NULL,
  `repoUrl` VARCHAR(500) NULL,
  `manifestId` VARCHAR(128) NULL,
  `manifestVersion` VARCHAR(64) NULL,
  `runId` VARCHAR(128) NOT NULL,
  `stage` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `usedAssets` JSON NOT NULL,
  `durationMs` INT NOT NULL DEFAULT 0,
  `failedReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `hub_runtime_report_projectName_idx` (`projectName`),
  KEY `hub_runtime_report_manifestId_manifestVersion_idx` (`manifestId`, `manifestVersion`),
  KEY `hub_runtime_report_runId_idx` (`runId`)
);
