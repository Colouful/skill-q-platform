-- V2.1 P0 Hub governance fields.
-- Generated from the diff between the committed Prisma schema and the current P0 schema.
-- This migration only adds nullable governance/query fields and indexes; it does not rewrite existing data.

-- AlterTable
ALTER TABLE `hub_asset` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `deprecatedAt` DATETIME(3) NULL,
    ADD COLUMN `latestVersionId` VARCHAR(36) NULL,
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL,
    ADD COLUMN `visibility` VARCHAR(40) NULL;

-- AlterTable
ALTER TABLE `hub_asset_version` ADD COLUMN `changelog` TEXT NULL,
    ADD COLUMN `contentSize` INTEGER NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `previousVersionId` VARCHAR(36) NULL,
    ADD COLUMN `publishedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedReason` TEXT NULL,
    ADD COLUMN `source` VARCHAR(80) NULL;

-- AlterTable
ALTER TABLE `hub_manifest` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `deprecatedAt` DATETIME(3) NULL,
    ADD COLUMN `latestVersionId` VARCHAR(36) NULL,
    ADD COLUMN `projectKinds` JSON NULL,
    ADD COLUMN `recommendedFor` JSON NULL,
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `techStacks` JSON NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `hub_manifest_version` ADD COLUMN `changelog` TEXT NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `exportSchemaVersion` VARCHAR(40) NULL,
    ADD COLUMN `previousVersionId` VARCHAR(36) NULL,
    ADD COLUMN `publishedBy` VARCHAR(191) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedReason` TEXT NULL;

-- AlterTable
ALTER TABLE `hub_manifest_asset` ADD COLUMN `addedAt` DATETIME(3) NULL,
    ADD COLUMN `addedBy` VARCHAR(191) NULL,
    ADD COLUMN `alias` VARCHAR(191) NULL,
    ADD COLUMN `policy` JSON NULL,
    ADD COLUMN `reason` TEXT NULL,
    ADD COLUMN `stage` VARCHAR(80) NULL;

-- AlterTable
ALTER TABLE `hub_agent_profile` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `deprecatedAt` DATETIME(3) NULL,
    ADD COLUMN `ownerOrgId` VARCHAR(191) NULL,
    ADD COLUMN `ownerTeamId` VARCHAR(191) NULL,
    ADD COLUMN `ownerUserId` VARCHAR(191) NULL,
    ADD COLUMN `publishedBy` VARCHAR(191) NULL,
    ADD COLUMN `riskLevel` VARCHAR(40) NULL;

-- AlterTable
ALTER TABLE `hub_install_record` ADD COLUMN `clientName` VARCHAR(80) NULL,
    ADD COLUMN `clientVersion` VARCHAR(80) NULL,
    ADD COLUMN `failureReason` TEXT NULL,
    ADD COLUMN `manifestChecksum` VARCHAR(128) NULL,
    ADD COLUMN `manifestSlug` VARCHAR(191) NULL,
    ADD COLUMN `manifestVersion` VARCHAR(40) NULL,
    ADD COLUMN `packageCount` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(40) NULL;

-- AlterTable
ALTER TABLE `hub_runtime_feedback` ADD COLUMN `assetSlugs` JSON NULL,
    ADD COLUMN `durationMs` INTEGER NULL,
    ADD COLUMN `executorType` VARCHAR(80) NULL,
    ADD COLUMN `failureCategory` VARCHAR(80) NULL,
    ADD COLUMN `manifestSlug` VARCHAR(191) NULL,
    ADD COLUMN `manifestVersion` VARCHAR(40) NULL,
    ADD COLUMN `privacyChecked` BOOLEAN NULL,
    ADD COLUMN `success` BOOLEAN NULL;

-- CreateIndex
CREATE INDEX `hub_install_record_manifestSlug_idx` ON `hub_install_record`(`manifestSlug`);

-- CreateIndex
CREATE INDEX `hub_runtime_feedback_manifestSlug_idx` ON `hub_runtime_feedback`(`manifestSlug`);
