-- 与 Prisma MySQL 默认及 repair 脚本一致：agents.id 及相关外键列为 varchar(191) utf8mb3_unicode_ci。
-- 避免后续新建表引用 agents(id) 时出现外键 3780（引用列与引用列长度/排序规则不一致）。
-- 幂等：已为 191 时 MODIFY 仍为等价定义。

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `agent_sessions` DROP FOREIGN KEY `agent_sessions_agentId_fkey`;
ALTER TABLE `agent_sessions` DROP FOREIGN KEY `agent_sessions_apiKeyId_fkey`;
ALTER TABLE `api_keys` DROP FOREIGN KEY `api_keys_agentId_fkey`;
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_authorAgentId_fkey`;
ALTER TABLE `rules` DROP FOREIGN KEY `rules_authorAgentId_fkey`;
ALTER TABLE `skills` DROP FOREIGN KEY `skills_authorAgentId_fkey`;

ALTER TABLE `agents` MODIFY COLUMN `id` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `api_keys` MODIFY COLUMN `id` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `api_keys` MODIFY COLUMN `agentId` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `agent_sessions` MODIFY COLUMN `id` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `agent_sessions` MODIFY COLUMN `agentId` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `agent_sessions` MODIFY COLUMN `apiKeyId` VARCHAR(191) NOT NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `skills` MODIFY COLUMN `authorAgentId` VARCHAR(191) NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `rules` MODIFY COLUMN `authorAgentId` VARCHAR(191) NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `reviews` MODIFY COLUMN `authorAgentId` VARCHAR(191) NULL COLLATE utf8mb3_unicode_ci;
ALTER TABLE `download_logs` MODIFY COLUMN `agentId` VARCHAR(191) NULL;

ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `skills` ADD CONSTRAINT `skills_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `rules` ADD CONSTRAINT `rules_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
