import { HubError } from "./errors";

export const ASSET_ERROR = {
  notFound: () => new HubError("ASSET_NOT_FOUND", "资产不存在", "请确认资产 ID 是否正确。", 404),
  slugExists: () =>
    new HubError("ASSET_SLUG_ALREADY_EXISTS", "资产 slug 已存在", "请更换唯一的资产 slug 后重试。", 409),
  createInvalid: (message = "资产创建参数不合法") =>
    new HubError("ASSET_CREATE_INVALID", message, "请检查 slug、name、kind、scope 等必填字段。", 400),
  updateNotAllowed: () =>
    new HubError("ASSET_UPDATE_NOT_ALLOWED", "当前资产状态不允许修改", "只有 draft 或 rejected 状态资产可以修改基础信息。", 409),
  archived: () => new HubError("ASSET_ARCHIVED", "资产已归档", "已归档资产不能修改或新增版本。", 409),
  versionNotFound: () => new HubError("ASSET_VERSION_NOT_FOUND", "资产版本不存在", "请确认资产 ID 和版本 ID 是否匹配。", 404),
  versionExists: () =>
    new HubError("ASSET_VERSION_ALREADY_EXISTS", "资产版本已存在", "请更换 version 后再创建。", 409),
  versionCreateInvalid: (message = "资产版本创建参数不合法") =>
    new HubError("ASSET_VERSION_CREATE_INVALID", message, "请检查 version、content、contentFormat 等字段。", 400),
  publishNotAllowed: () =>
    new HubError("ASSET_VERSION_PUBLISH_NOT_ALLOWED", "当前资产版本状态不允许发布", "只有 draft 或 reviewing 状态版本可以发布。", 409),
  deprecateNotAllowed: () =>
    new HubError("ASSET_VERSION_DEPRECATE_NOT_ALLOWED", "当前资产版本状态不允许废弃", "只有 published 状态版本可以废弃。", 409),
  checksumRequired: () => new HubError("CHECKSUM_REQUIRED", "资产版本 checksum 不能为空", "请重新生成 checksum 后再发布。", 400),
  contentRequired: () => new HubError("CONTENT_REQUIRED", "资产版本 content 不能为空", "请补充资产正文后再提交。", 400),
  invalidPagination: () => new HubError("INVALID_PAGINATION", "分页参数不合法", "page 必须大于 0，pageSize 必须在 1 到 100 之间。", 400),
  invalidKind: () => new HubError("INVALID_ASSET_KIND", "资产类型不合法", "请使用平台支持的资产类型。", 400),
  invalidStatus: () => new HubError("INVALID_ASSET_STATUS", "资产状态不合法", "请使用平台支持的资产状态。", 400),
};
