-- Hub 专家结构对齐增量 SQL（在已执行 hub_phase1_asset_catalog.sql 的库上继续执行）
-- 目标：补齐 RoleTemplate 与 br-ai-spec 专家描述对齐所需字段

SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'roleStatus') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `roleStatus` VARCHAR(20) NOT NULL DEFAULT ''draft'' AFTER `publishStatus`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'triggers') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `triggers` JSON NULL AFTER `supportedProfiles`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'preferredSkills') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `preferredSkills` JSON NULL AFTER `triggers`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'reads') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `reads` JSON NULL AFTER `preferredSkills`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'writes') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `writes` JSON NULL AFTER `reads`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'handoffTo') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `handoffTo` JSON NULL AFTER `writes`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'rolePositioning') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `rolePositioning` TEXT NULL AFTER `handoffTo`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'workingPrinciples') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `workingPrinciples` JSON NULL AFTER `rolePositioning`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'requiredSteps') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `requiredSteps` JSON NULL AFTER `workingPrinciples`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'executionContract') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `executionContract` TEXT NULL AFTER `requiredSteps`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'outputStandard') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `outputStandard` TEXT NULL AFTER `executionContract`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'prohibitedActions') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `prohibitedActions` JSON NULL AFTER `outputStandard`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = @db AND table_name = 'role_templates' AND column_name = 'handoffNotes') > 0,
    'SELECT 1',
    'ALTER TABLE `role_templates` ADD COLUMN `handoffNotes` TEXT NULL AFTER `prohibitedActions`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
