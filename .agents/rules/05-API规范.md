---
alwaysApply: false
description: 项目的 API 规范，包括接口目录结构、请求封装、函数命名约定、类型定义、错误处理原则。当新增、修改、重构或重写接口时读取此规则。
---

# API 规范

## 目录结构

```text
src/
├── app/api/**/route.ts      # 服务端 API Route Handler（Next App Router）
├── lib/client-api.ts        # 客户端请求封装（fetchApi）
├── lib/api-response.ts      # 统一响应结构
└── lib/api-errors.ts        # 异常到响应的转换
```

## 接口请求规范

- 服务端接口统一使用 `src/app/api/**/route.ts`。
- 客户端默认通过 `fetchApi<T>()` 调用；上传进度等特殊场景使用 `postJsonWithUploadProgress()`。
- 请求体为 JSON 时统一设置 `Content-Type: application/json`。
- 需要附加身份头时，统一通过请求封装注入，不在业务组件重复拼接。

## 接口函数命名（NON-NEGOTIABLE）

本项目采用“资源语义 + HTTP 方法”命名，而非固定 `getXxxApi` 前缀。

| 操作 | 命名规则 | 示例 |
|------|----------|------|
| 读列表 | 路由文件导出 `GET` | `src/app/api/skills/route.ts` |
| 新增资源 | 路由文件导出 `POST` | `src/app/api/skills/route.ts` |
| 更新资源 | 路由文件导出 `PUT` / `PATCH` | `src/app/api/admin/config/update/route.ts` |
| 删除资源 | 路由文件导出 `DELETE` | `src/app/api/skills/[slug]/delete/route.ts` |
| 客户端调用 | 动作语义函数 | `fetchApi` |

## 接口错误处理

- 服务端统一使用标准响应函数（如 `jsonOk` / `jsonErr`）返回。
- 异常捕获后通过统一转换函数（如 `toApiResponse`）输出可消费错误。
- 客户端收到非 2xx 响应时，优先解析后端统一错误结构；若缺失则回落到 HTTP 状态码与状态文案。
