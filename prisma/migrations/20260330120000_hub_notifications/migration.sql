-- utf8mb3；站内通知（避免与浏览器 Notification API 同名，表名 hub_notifications）
-- agent_id 必须与 agents.id 一致：varchar(191) + utf8mb3_unicode_ci（见 20260330115800_align_agents_varchar191），否则外键 3780
CREATE TABLE `hub_notifications` (
  `id` VARCHAR(36) NOT NULL,
  `agent_id` VARCHAR(191) COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` VARCHAR(40) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT false,
  `read_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `hub_notifications_agent_id_idx`(`agent_id`),
  INDEX `hub_notifications_agent_id_is_read_idx`(`agent_id`, `is_read`),
  CONSTRAINT `hub_notifications_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
