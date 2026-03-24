-- 失败迁移后的手工清理（按报错逐段执行；不存在的对象会报错，可跳过该句）
-- 完成后执行：npx prisma migrate resolve --rolled-back "20260325120000_add_agent_auth"
-- 再执行：npx prisma migrate deploy

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `agent_sessions`;
DROP TABLE IF EXISTS `api_keys`;

ALTER TABLE `skills` DROP FOREIGN KEY `skills_authorAgentId_fkey`;
ALTER TABLE `rules` DROP FOREIGN KEY `rules_authorAgentId_fkey`;
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_authorAgentId_fkey`;

DROP TABLE IF EXISTS `agents`;

ALTER TABLE `skills` DROP COLUMN `authorAgentId`;
ALTER TABLE `rules` DROP COLUMN `authorAgentId`;
ALTER TABLE `reviews` DROP COLUMN `authorAgentId`;

SET FOREIGN_KEY_CHECKS = 1;
