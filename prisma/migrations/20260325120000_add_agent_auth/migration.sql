-- Agent 认证：与现有 skills/rules 表一致 —— VARCHAR(36) + utf8mb3_general_ci（避免 FK 3780）
CREATE TABLE `agents` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `avatar` VARCHAR(500) NULL,
    `agentType` VARCHAR(50) NOT NULL DEFAULT 'unknown',
    `level` INTEGER NOT NULL DEFAULT 1,
    `levelName` VARCHAR(20) NOT NULL DEFAULT '见习特工',
    `experience` INTEGER NOT NULL DEFAULT 0,
    `apiCallsTotal` INTEGER NOT NULL DEFAULT 0,
    `uploadsCount` INTEGER NOT NULL DEFAULT 0,
    `downloadsCount` INTEGER NOT NULL DEFAULT 0,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastActiveAt` DATETIME(3) NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    UNIQUE INDEX `agents_slug_key`(`slug`),
    INDEX `agents_slug_idx`(`slug`),
    INDEX `agents_agentType_idx`(`agentType`),
    INDEX `agents_level_idx`(`level`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `api_keys` (
    `id` VARCHAR(36) NOT NULL,
    `key_hash` VARCHAR(64) NOT NULL,
    `keyPrefix` VARCHAR(24) NOT NULL,
    `agentId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL DEFAULT 'Default',
    `description` TEXT NULL,
    `scopes` JSON NOT NULL,
    `rateLimit` INTEGER NOT NULL DEFAULT 100,
    `expiresAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `api_keys_key_hash_key`(`key_hash`),
    INDEX `api_keys_agentId_idx`(`agentId`),
    INDEX `api_keys_keyPrefix_idx`(`keyPrefix`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `agent_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(64) NOT NULL,
    `agentId` VARCHAR(36) NOT NULL,
    `apiKeyId` VARCHAR(36) NOT NULL,
    `userAgent` VARCHAR(500) NULL,
    `ipAddress` VARCHAR(50) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `agent_sessions_sessionId_key`(`sessionId`),
    INDEX `agent_sessions_sessionId_idx`(`sessionId`),
    INDEX `agent_sessions_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `skills` ADD COLUMN `authorAgentId` VARCHAR(36) NULL;
CREATE INDEX `skills_authorAgentId_idx` ON `skills`(`authorAgentId`);
ALTER TABLE `skills` ADD CONSTRAINT `skills_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `rules` ADD COLUMN `authorAgentId` VARCHAR(36) NULL;
CREATE INDEX `rules_authorAgentId_idx` ON `rules`(`authorAgentId`);
ALTER TABLE `rules` ADD CONSTRAINT `rules_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `reviews` ADD COLUMN `authorAgentId` VARCHAR(36) NULL;
CREATE INDEX `reviews_authorAgentId_idx` ON `reviews`(`authorAgentId`);
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_authorAgentId_fkey` FOREIGN KEY (`authorAgentId`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
