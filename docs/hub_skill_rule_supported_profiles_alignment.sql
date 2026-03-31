-- Hub Skill / Rule supportedProfiles 对齐脚本
-- 用途：
--   1) 幂等确保 skills / rules 已有 supportedProfiles 列
--   2) 审计当前 supportedProfiles 的存储情况
--   3) 将非 JSON 数组值兼容归一为 NULL
--
-- 约定：
--   - [] 表示显式 common
--   - NULL 表示历史未配置 / 兼容 common
--   - profile 专属场景使用 JSON 数组，如 ["react"]、["react","vue"]

SET @db := DATABASE();

-- -----------------------------------------------------------------------------
-- 1) 幂等确保字段存在
-- -----------------------------------------------------------------------------

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
-- 2) 归一前审计
-- -----------------------------------------------------------------------------

SELECT
  'skills' AS table_name,
  COUNT(*) AS total_rows,
  SUM(`supportedProfiles` IS NULL) AS null_rows,
  SUM(JSON_TYPE(`supportedProfiles`) = 'ARRAY') AS array_rows,
  SUM(`supportedProfiles` IS NOT NULL AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY') AS invalid_rows
FROM `skills`;

SELECT
  'rules' AS table_name,
  COUNT(*) AS total_rows,
  SUM(`supportedProfiles` IS NULL) AS null_rows,
  SUM(JSON_TYPE(`supportedProfiles`) = 'ARRAY') AS array_rows,
  SUM(`supportedProfiles` IS NOT NULL AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY') AS invalid_rows
FROM `rules`;

SELECT
  `id`,
  `slug`,
  JSON_TYPE(`supportedProfiles`) AS json_type,
  CAST(`supportedProfiles` AS CHAR(255)) AS raw_value
FROM `skills`
WHERE `supportedProfiles` IS NOT NULL
  AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY'
ORDER BY `updatedAt` DESC
LIMIT 100;

SELECT
  `id`,
  `slug`,
  JSON_TYPE(`supportedProfiles`) AS json_type,
  CAST(`supportedProfiles` AS CHAR(255)) AS raw_value
FROM `rules`
WHERE `supportedProfiles` IS NOT NULL
  AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY'
ORDER BY `updatedAt` DESC
LIMIT 100;

-- -----------------------------------------------------------------------------
-- 3) 兼容归一：非数组值统一回写为 NULL
-- -----------------------------------------------------------------------------

UPDATE `skills`
SET `supportedProfiles` = NULL
WHERE `supportedProfiles` IS NOT NULL
  AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY';

UPDATE `rules`
SET `supportedProfiles` = NULL
WHERE `supportedProfiles` IS NOT NULL
  AND JSON_TYPE(`supportedProfiles`) <> 'ARRAY';

-- -----------------------------------------------------------------------------
-- 4) 归一后复核
-- -----------------------------------------------------------------------------

SELECT
  'skills' AS table_name,
  COUNT(*) AS total_rows,
  SUM(`supportedProfiles` IS NULL) AS null_rows,
  SUM(JSON_TYPE(`supportedProfiles`) = 'ARRAY') AS array_rows,
  SUM(JSON_LENGTH(`supportedProfiles`) = 0) AS explicit_common_rows
FROM `skills`;

SELECT
  'rules' AS table_name,
  COUNT(*) AS total_rows,
  SUM(`supportedProfiles` IS NULL) AS null_rows,
  SUM(JSON_TYPE(`supportedProfiles`) = 'ARRAY') AS array_rows,
  SUM(JSON_LENGTH(`supportedProfiles`) = 0) AS explicit_common_rows
FROM `rules`;
