-- 初始化 Hub 管理员账号
-- 默认账号: admin
-- 默认密码: Admin@123
--
-- 说明:
-- 1. 本项目管理员密码使用 scrypt，格式:
--    scrypt1$<saltHex>$<hashHex>
-- 2. 这里复用当前仓库 seed / docs 中已经验证可用的一组哈希。
-- 3. 脚本可重复执行:
--    - 如果 admins.email = 'admin' 不存在，则插入
--    - 如果已存在，则更新密码、角色、权限和启用状态

START TRANSACTION;

INSERT INTO `admins` (
  `id`,
  `email`,
  `passwordHash`,
  `role`,
  `permissions`,
  `isActive`,
  `lastLoginAt`,
  `createdAt`
) VALUES (
  'd834864e-1035-4521-8634-9c3c054191e0',
  'admin',
  'scrypt1$46cdd09abba728e9f6230819d39d0663$b0c34093ed42515e8af01e789bcdd497147c52233ca95d66fa3cdd841bf87414044fba5680eef66fb9c6fa8aa1d63e80d804b81684e6bac685a6c247f0c1cb7f',
  'admin',
  '[]',
  1,
  NULL,
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `passwordHash` = VALUES(`passwordHash`),
  `role` = 'admin',
  `permissions` = '[]',
  `isActive` = 1;

COMMIT;

-- 登录入口:
-- /admin/login
