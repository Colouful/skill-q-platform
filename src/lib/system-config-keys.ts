/** 与 SystemConfig 表 config_key 一致；可安全被 Client Component 引用（无 prisma） */
export const SYSTEM_CONFIG_KEYS = {
  SITE_NAME: "site_name",
  SITE_URL: "site_url",
  DEFAULT_DOWNLOAD_POLICY: "default_download_policy",
  REGISTER_MAX_PER_HOUR: "register_max_per_hour",
  MAINTENANCE_MODE: "maintenance_mode",
  /** 为 true 时：未登录不能创建/分叉 Skill·Rule 及上传新版本（仍可用 HUB_AUTH 做作者头校验） */
  UPLOAD_REQUIRES_LOGIN: "upload_requires_login",
  /**
   * 为 true：新建 / Fork 的 Skill·Rule 为 pending，需后台审核后上架。
   * 为 false：创建后直接 published（仍可在后台改策略或手动下架）。
   */
  RESOURCE_UPLOAD_REQUIRES_MODERATION: "resource_upload_requires_moderation",
} as const;
