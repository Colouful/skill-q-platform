-- P5 Asset Hub 兼容迁移
-- 目标：合并历史 Hub schema 与 V2.1 governance schema 的字段，支持 P5 Fork / Override / 继承与 br-ai-spec AssetPackage 元数据。
-- 回滚说明：
-- 1. 如需回滚代码，直接回退本迁移对应提交。
-- 2. 如数据库已经执行迁移，优先保留新增列以避免历史数据丢失；确需回滚时，先备份 hub_asset、hub_asset_version、hub_manifest、hub_manifest_version、hub_manifest_asset、hub_install_record。
-- 3. 备份后可按需 DROP 下列新增兼容列，但不建议删除已写入的业务数据列。

ALTER TABLE `hub_asset`
  ADD COLUMN IF NOT EXISTS `assetId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `displayName` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `ownerId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `teamId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `riskLevel` VARCHAR(8) NOT NULL DEFAULT 'L0',
  ADD COLUMN IF NOT EXISTS `parentAssetId` VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS `overrideFields` JSON NULL,
  ADD COLUMN IF NOT EXISTS `metadata` JSON NULL;

ALTER TABLE `hub_asset_version`
  ADD COLUMN IF NOT EXISTS `contentUrl` VARCHAR(500) NULL;

ALTER TABLE `hub_manifest`
  ADD COLUMN IF NOT EXISTS `manifestId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `displayName` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `ides` JSON NULL,
  ADD COLUMN IF NOT EXISTS `scenarios` JSON NULL;

ALTER TABLE `hub_manifest_version`
  ADD COLUMN IF NOT EXISTS `exportSnapshot` JSON NULL,
  ADD COLUMN IF NOT EXISTS `releaseNote` TEXT NULL;

ALTER TABLE `hub_manifest_asset`
  ADD COLUMN IF NOT EXISTS `manifestId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `version` VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS `installPath` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `checksum` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `sortOrder` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `config` JSON NULL;

ALTER TABLE `hub_install_record`
  ADD COLUMN IF NOT EXISTS `projectName` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `repoUrl` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `manifestId` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `installMode` VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS `message` TEXT NULL;
