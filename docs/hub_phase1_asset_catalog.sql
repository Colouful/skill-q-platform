-- Hub 一期资产目录 SQL（手工执行版）
-- 范围：
--   - Role / ScenarioPackage / CapabilityDomain / IndustryTag
--   - skills / rules 的最小增量元数据
-- 不包含：
--   - Flow
--   - Workspace / Project / Sync / Run
--   - ManifestSnapshot
--
-- 目标数据库：MySQL / MariaDB
-- 风格对齐当前仓库：
--   - utf8mb3
--   - InnoDB
--   - DATETIME(3)
--   - 通过 information_schema 做已有表幂等加列

SET @db := DATABASE();

-- -----------------------------------------------------------------------------
-- 1) skills / rules 最小增量字段
-- -----------------------------------------------------------------------------

-- skills.supportedProfiles
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'skills'
        AND column_name = 'supportedProfiles') > 0,
    'SELECT 1',
    'ALTER TABLE `skills` ADD COLUMN `supportedProfiles` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- rules.supportedProfiles
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.columns
      WHERE table_schema = @db
        AND table_name = 'rules'
        AND column_name = 'supportedProfiles') > 0,
    'SELECT 1',
    'ALTER TABLE `rules` ADD COLUMN `supportedProfiles` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 2) Role 资产
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role_templates` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` TEXT NOT NULL,
  `longDescription` TEXT NULL,
  `author` VARCHAR(100) NOT NULL,
  `authorAgentId` VARCHAR(191) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,
  `publishStatus` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `roleStatus` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `tags` JSON NULL,
  `supportedProfiles` JSON NULL,
  `triggers` JSON NULL,
  `preferredSkills` JSON NULL,
  `reads` JSON NULL,
  `writes` JSON NULL,
  `handoffTo` JSON NULL,
  `rolePositioning` TEXT NULL,
  `workingPrinciples` JSON NULL,
  `requiredSteps` JSON NULL,
  `executionContract` TEXT NULL,
  `outputStandard` TEXT NULL,
  `prohibitedActions` JSON NULL,
  `handoffNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_templates_slug_key` (`slug`),
  KEY `role_templates_slug_idx` (`slug`),
  KEY `role_templates_publishStatus_idx` (`publishStatus`),
  KEY `role_templates_authorAgentId_idx` (`authorAgentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- 兼容“第一次已建表、但外键加失败”的半执行状态：
-- agents.id 当前为 varchar(191) CHARACTER SET utf8 COLLATE utf8_unicode_ci，
-- 这里先把 role_templates.authorAgentId 调整为完全一致，再尝试加外键。
ALTER TABLE `role_templates`
  MODIFY COLUMN `authorAgentId` VARCHAR(191) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_templates'
        AND constraint_name = 'role_templates_authorAgentId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_templates` ADD CONSTRAINT `role_templates_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `role_versions` (
  `id` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `version` VARCHAR(20) NOT NULL,
  `changelog` TEXT NULL,
  `files` JSON NOT NULL,
  `downloadUrl` VARCHAR(500) NULL,
  `isLatest` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_versions_roleId_version_key` (`roleId`, `version`),
  KEY `role_versions_roleId_idx` (`roleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_versions'
        AND constraint_name = 'role_versions_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_versions` ADD CONSTRAINT `role_versions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `role_skill_links` (
  `id` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_skill_links_roleId_skillId_key` (`roleId`, `skillId`),
  KEY `role_skill_links_roleId_idx` (`roleId`),
  KEY `role_skill_links_skillId_idx` (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_skill_links'
        AND constraint_name = 'role_skill_links_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_skill_links` ADD CONSTRAINT `role_skill_links_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_skill_links'
        AND constraint_name = 'role_skill_links_skillId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_skill_links` ADD CONSTRAINT `role_skill_links_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `role_rule_links` (
  `id` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `ruleId` VARCHAR(36) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_rule_links_roleId_ruleId_key` (`roleId`, `ruleId`),
  KEY `role_rule_links_roleId_idx` (`roleId`),
  KEY `role_rule_links_ruleId_idx` (`ruleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_rule_links'
        AND constraint_name = 'role_rule_links_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_rule_links` ADD CONSTRAINT `role_rule_links_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'role_rule_links'
        AND constraint_name = 'role_rule_links_ruleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_rule_links` ADD CONSTRAINT `role_rule_links_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 3) ScenarioPackage 资产
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `scenario_packages` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` TEXT NOT NULL,
  `longDescription` TEXT NULL,
  `publishStatus` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `supportedProfiles` JSON NULL,
  `recommendedIdes` JSON NULL,
  `entryRoleId` VARCHAR(36) NULL,
  `tags` JSON NULL,
  `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_packages_slug_key` (`slug`),
  KEY `scenario_packages_slug_idx` (`slug`),
  KEY `scenario_packages_publishStatus_idx` (`publishStatus`),
  KEY `scenario_packages_entryRoleId_idx` (`entryRoleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_packages'
        AND constraint_name = 'scenario_packages_entryRoleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_packages` ADD CONSTRAINT `scenario_packages_entryRoleId_fkey` FOREIGN KEY (`entryRoleId`) REFERENCES `role_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scenario_package_roles` (
  `id` VARCHAR(36) NOT NULL,
  `scenarioPackageId` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isOptional` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_package_roles_scenarioPackageId_roleId_key` (`scenarioPackageId`, `roleId`),
  KEY `scenario_package_roles_scenarioPackageId_idx` (`scenarioPackageId`),
  KEY `scenario_package_roles_roleId_idx` (`roleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_roles'
        AND constraint_name = 'scenario_package_roles_scenarioPackageId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_roles` ADD CONSTRAINT `scenario_package_roles_scenarioPackageId_fkey` FOREIGN KEY (`scenarioPackageId`) REFERENCES `scenario_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_roles'
        AND constraint_name = 'scenario_package_roles_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_roles` ADD CONSTRAINT `scenario_package_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scenario_package_skills` (
  `id` VARCHAR(36) NOT NULL,
  `scenarioPackageId` VARCHAR(36) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_package_skills_scenarioPackageId_skillId_key` (`scenarioPackageId`, `skillId`),
  KEY `scenario_package_skills_scenarioPackageId_idx` (`scenarioPackageId`),
  KEY `scenario_package_skills_skillId_idx` (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_skills'
        AND constraint_name = 'scenario_package_skills_scenarioPackageId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_skills` ADD CONSTRAINT `scenario_package_skills_scenarioPackageId_fkey` FOREIGN KEY (`scenarioPackageId`) REFERENCES `scenario_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_skills'
        AND constraint_name = 'scenario_package_skills_skillId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_skills` ADD CONSTRAINT `scenario_package_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scenario_package_rules` (
  `id` VARCHAR(36) NOT NULL,
  `scenarioPackageId` VARCHAR(36) NOT NULL,
  `ruleId` VARCHAR(36) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_package_rules_scenarioPackageId_ruleId_key` (`scenarioPackageId`, `ruleId`),
  KEY `scenario_package_rules_scenarioPackageId_idx` (`scenarioPackageId`),
  KEY `scenario_package_rules_ruleId_idx` (`ruleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_rules'
        AND constraint_name = 'scenario_package_rules_scenarioPackageId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_rules` ADD CONSTRAINT `scenario_package_rules_scenarioPackageId_fkey` FOREIGN KEY (`scenarioPackageId`) REFERENCES `scenario_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*)
       FROM information_schema.table_constraints
      WHERE table_schema = @db
        AND table_name = 'scenario_package_rules'
        AND constraint_name = 'scenario_package_rules_ruleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_package_rules` ADD CONSTRAINT `scenario_package_rules_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 4) 能力域 / 行业标签字典
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `capability_domains` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `capability_domains_slug_key` (`slug`),
  UNIQUE KEY `capability_domains_name_key` (`name`),
  KEY `capability_domains_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `industry_tags` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `industry_tags_slug_key` (`slug`),
  UNIQUE KEY `industry_tags_name_key` (`name`),
  KEY `industry_tags_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- -----------------------------------------------------------------------------
-- 5) 能力域映射表
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role_domain_links` (
  `id` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `domainId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_domain_links_roleId_domainId_key` (`roleId`, `domainId`),
  KEY `role_domain_links_roleId_idx` (`roleId`),
  KEY `role_domain_links_domainId_idx` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'role_domain_links'
        AND constraint_name = 'role_domain_links_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_domain_links` ADD CONSTRAINT `role_domain_links_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'role_domain_links'
        AND constraint_name = 'role_domain_links_domainId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_domain_links` ADD CONSTRAINT `role_domain_links_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `capability_domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `skill_domain_links` (
  `id` VARCHAR(36) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `domainId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skill_domain_links_skillId_domainId_key` (`skillId`, `domainId`),
  KEY `skill_domain_links_skillId_idx` (`skillId`),
  KEY `skill_domain_links_domainId_idx` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'skill_domain_links'
        AND constraint_name = 'skill_domain_links_skillId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `skill_domain_links` ADD CONSTRAINT `skill_domain_links_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'skill_domain_links'
        AND constraint_name = 'skill_domain_links_domainId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `skill_domain_links` ADD CONSTRAINT `skill_domain_links_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `capability_domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `rule_domain_links` (
  `id` VARCHAR(36) NOT NULL,
  `ruleId` VARCHAR(36) NOT NULL,
  `domainId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_domain_links_ruleId_domainId_key` (`ruleId`, `domainId`),
  KEY `rule_domain_links_ruleId_idx` (`ruleId`),
  KEY `rule_domain_links_domainId_idx` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'rule_domain_links'
        AND constraint_name = 'rule_domain_links_ruleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `rule_domain_links` ADD CONSTRAINT `rule_domain_links_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'rule_domain_links'
        AND constraint_name = 'rule_domain_links_domainId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `rule_domain_links` ADD CONSTRAINT `rule_domain_links_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `capability_domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scenario_domain_links` (
  `id` VARCHAR(36) NOT NULL,
  `scenarioPackageId` VARCHAR(36) NOT NULL,
  `domainId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_domain_links_scenarioPackageId_domainId_key` (`scenarioPackageId`, `domainId`),
  KEY `scenario_domain_links_scenarioPackageId_idx` (`scenarioPackageId`),
  KEY `scenario_domain_links_domainId_idx` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'scenario_domain_links'
        AND constraint_name = 'scenario_domain_links_scenarioPackageId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_domain_links` ADD CONSTRAINT `scenario_domain_links_scenarioPackageId_fkey` FOREIGN KEY (`scenarioPackageId`) REFERENCES `scenario_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'scenario_domain_links'
        AND constraint_name = 'scenario_domain_links_domainId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_domain_links` ADD CONSTRAINT `scenario_domain_links_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `capability_domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 6) 行业标签映射表
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role_industry_links` (
  `id` VARCHAR(36) NOT NULL,
  `roleId` VARCHAR(36) NOT NULL,
  `industryTagId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_industry_links_roleId_industryTagId_key` (`roleId`, `industryTagId`),
  KEY `role_industry_links_roleId_idx` (`roleId`),
  KEY `role_industry_links_industryTagId_idx` (`industryTagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'role_industry_links'
        AND constraint_name = 'role_industry_links_roleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_industry_links` ADD CONSTRAINT `role_industry_links_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'role_industry_links'
        AND constraint_name = 'role_industry_links_industryTagId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `role_industry_links` ADD CONSTRAINT `role_industry_links_industryTagId_fkey` FOREIGN KEY (`industryTagId`) REFERENCES `industry_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `skill_industry_links` (
  `id` VARCHAR(36) NOT NULL,
  `skillId` VARCHAR(36) NOT NULL,
  `industryTagId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skill_industry_links_skillId_industryTagId_key` (`skillId`, `industryTagId`),
  KEY `skill_industry_links_skillId_idx` (`skillId`),
  KEY `skill_industry_links_industryTagId_idx` (`industryTagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'skill_industry_links'
        AND constraint_name = 'skill_industry_links_skillId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `skill_industry_links` ADD CONSTRAINT `skill_industry_links_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'skill_industry_links'
        AND constraint_name = 'skill_industry_links_industryTagId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `skill_industry_links` ADD CONSTRAINT `skill_industry_links_industryTagId_fkey` FOREIGN KEY (`industryTagId`) REFERENCES `industry_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `rule_industry_links` (
  `id` VARCHAR(36) NOT NULL,
  `ruleId` VARCHAR(36) NOT NULL,
  `industryTagId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_industry_links_ruleId_industryTagId_key` (`ruleId`, `industryTagId`),
  KEY `rule_industry_links_ruleId_idx` (`ruleId`),
  KEY `rule_industry_links_industryTagId_idx` (`industryTagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'rule_industry_links'
        AND constraint_name = 'rule_industry_links_ruleId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `rule_industry_links` ADD CONSTRAINT `rule_industry_links_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'rule_industry_links'
        AND constraint_name = 'rule_industry_links_industryTagId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `rule_industry_links` ADD CONSTRAINT `rule_industry_links_industryTagId_fkey` FOREIGN KEY (`industryTagId`) REFERENCES `industry_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `scenario_industry_links` (
  `id` VARCHAR(36) NOT NULL,
  `scenarioPackageId` VARCHAR(36) NOT NULL,
  `industryTagId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scenario_industry_links_scenarioPackageId_industryTagId_key` (`scenarioPackageId`, `industryTagId`),
  KEY `scenario_industry_links_scenarioPackageId_idx` (`scenarioPackageId`),
  KEY `scenario_industry_links_industryTagId_idx` (`industryTagId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'scenario_industry_links'
        AND constraint_name = 'scenario_industry_links_scenarioPackageId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_industry_links` ADD CONSTRAINT `scenario_industry_links_scenarioPackageId_fkey` FOREIGN KEY (`scenarioPackageId`) REFERENCES `scenario_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE table_schema = @db AND table_name = 'scenario_industry_links'
        AND constraint_name = 'scenario_industry_links_industryTagId_fkey'
        AND constraint_type = 'FOREIGN KEY') = 0,
    'ALTER TABLE `scenario_industry_links` ADD CONSTRAINT `scenario_industry_links_industryTagId_fkey` FOREIGN KEY (`industryTagId`) REFERENCES `industry_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- 7) 字典种子数据
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO `capability_domains` (`id`, `name`, `slug`, `description`, `sortOrder`) VALUES
  ('17aa9c4f-0f28-4b4f-a001-000000000001', '需求设计域', 'demand-design', '需求分析、方案设计、提案产出相关能力域。', 0),
  ('17aa9c4f-0f28-4b4f-a001-000000000002', '规范治理域', 'governance', '规范、约束、评审、质量闸门相关能力域。', 1),
  ('17aa9c4f-0f28-4b4f-a001-000000000003', '工程构建域', 'engineering', '前后端实现、工程结构、构建交付相关能力域。', 2),
  ('17aa9c4f-0f28-4b4f-a001-000000000004', '测试验证域', 'testing-validation', '测试设计、验证、回归检查相关能力域。', 3),
  ('17aa9c4f-0f28-4b4f-a001-000000000005', '文档知识域', 'documentation-knowledge', '文档生成、知识沉淀、术语规范相关能力域。', 4),
  ('17aa9c4f-0f28-4b4f-a001-000000000006', '性能体验域', 'performance-experience', '性能优化、体验设计、可用性提升相关能力域。', 5),
  ('17aa9c4f-0f28-4b4f-a001-000000000007', '可观测治理域', 'observability', '日志、监控、追踪、观测治理相关能力域。', 6),
  ('17aa9c4f-0f28-4b4f-a001-000000000008', '安全与可访问性域', 'security-accessibility', '安全、权限、可访问性相关能力域。', 7);

INSERT IGNORE INTO `industry_tags` (`id`, `name`, `slug`, `description`, `sortOrder`) VALUES
  ('2dbe0b59-9348-4a22-b001-000000000001', '金融', 'finance', '金融业务或风控相关场景。', 0),
  ('2dbe0b59-9348-4a22-b001-000000000002', '教育', 'education', '教育类产品与教学工具场景。', 1),
  ('2dbe0b59-9348-4a22-b001-000000000003', '设计', 'design', '设计、交互、视觉生产场景。', 2),
  ('2dbe0b59-9348-4a22-b001-000000000004', '办公效率', 'productivity', '办公提效、协同自动化场景。', 3),
  ('2dbe0b59-9348-4a22-b001-000000000005', '自媒体', 'media', '内容生产、分发、运营场景。', 4),
  ('2dbe0b59-9348-4a22-b001-000000000006', '数据分析', 'data-analysis', '数据处理、分析、报表场景。', 5);
