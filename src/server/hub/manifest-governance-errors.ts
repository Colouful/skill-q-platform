import { HubError } from "./errors";

export const MANIFEST_ERROR = {
  notFound: () => new HubError("MANIFEST_NOT_FOUND", "Manifest 不存在", "请确认 Manifest ID 是否正确。", 404),
  slugExists: () =>
    new HubError("MANIFEST_SLUG_ALREADY_EXISTS", "Manifest slug 已存在", "请更换唯一的 Manifest slug 后重试。", 409),
  createInvalid: (message = "Manifest 创建参数不合法") =>
    new HubError("MANIFEST_CREATE_INVALID", message, "请检查 slug、name、scope 等必填字段。", 400),
  updateNotAllowed: () =>
    new HubError("MANIFEST_UPDATE_NOT_ALLOWED", "当前 Manifest 状态不允许修改", "只有 draft 或 rejected 状态 Manifest 可以修改基础信息。", 409),
  archived: () => new HubError("MANIFEST_ARCHIVED", "Manifest 已归档", "已归档 Manifest 不能修改或新增版本。", 409),
  versionNotFound: () => new HubError("MANIFEST_VERSION_NOT_FOUND", "Manifest 版本不存在", "请确认 Manifest ID 和版本 ID 是否匹配。", 404),
  versionExists: () =>
    new HubError("MANIFEST_VERSION_ALREADY_EXISTS", "Manifest 版本已存在", "请更换 version 后再创建。", 409),
  versionCreateInvalid: (message = "Manifest 版本创建参数不合法") =>
    new HubError("MANIFEST_VERSION_CREATE_INVALID", message, "请检查 version、installPolicy、compatibility 等字段。", 400),
  publishNotAllowed: () =>
    new HubError("MANIFEST_VERSION_PUBLISH_NOT_ALLOWED", "当前 Manifest 版本状态不允许发布", "只有 draft 或 reviewing 状态版本可以发布。", 409),
  deprecateNotAllowed: () =>
    new HubError("MANIFEST_VERSION_DEPRECATE_NOT_ALLOWED", "当前 Manifest 版本状态不允许废弃", "只有 published 状态版本可以废弃。", 409),
  bindingNotFound: () =>
    new HubError("MANIFEST_ASSET_BINDING_NOT_FOUND", "Manifest 资产绑定不存在", "请确认 bindingId 是否正确。", 404),
  bindingExists: () =>
    new HubError("MANIFEST_ASSET_BINDING_ALREADY_EXISTS", "Manifest 已绑定该资产版本", "请勿重复绑定同一个 AssetVersion。", 409),
  bindingNotAllowed: (message = "当前 Manifest 版本不允许修改资产绑定") =>
    new HubError("MANIFEST_ASSET_BINDING_NOT_ALLOWED", message, "请确认 Manifest 版本状态和资产版本状态。", 409),
  requiredAssetMissing: () =>
    new HubError("MANIFEST_REQUIRED_ASSET_MISSING", "Manifest 至少需要绑定一个 required asset", "请先绑定必需资产后再发布。", 400),
  assetNotPublished: () =>
    new HubError("MANIFEST_ASSET_NOT_PUBLISHED", "Manifest 只能绑定已发布资产版本", "请先发布 AssetVersion 后再绑定。", 409),
  assetArchived: () =>
    new HubError("MANIFEST_ASSET_ARCHIVED", "已归档资产不允许绑定到 Manifest", "请选择 published 状态的未归档资产版本。", 409),
  checksumRequired: () => new HubError("CHECKSUM_REQUIRED", "Manifest checksum 不能为空", "请重新生成 checksum 后再发布。", 400),
  invalidPagination: () => new HubError("INVALID_PAGINATION", "分页参数不合法", "page 必须大于 0，pageSize 必须在 1 到 100 之间。", 400),
  invalidStatus: () => new HubError("INVALID_MANIFEST_STATUS", "Manifest 状态不合法", "请使用平台支持的 Manifest 状态。", 400),
};
