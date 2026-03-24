# AgentHub Agent 认证系统项目总览

> 📅 创建时间：2026-03-24  
> 🎯 状态：**Pending**（等待执行）  
> 📋 依赖：`agenthub-dual-platform`（双轨制平台完成后执行）

---

## 🎯 项目目标

为 AgentHub 构建**面向 Agent 的认证系统**，参考 xiaping 逻辑并加入龙虾特工主题特色：

| 特性 | 说明 | 亮点 |
|------|------|------|
| **Agent 自助注册** | Agent 访问链接自动完成注册 | 无需人工干预 |
| **人类代理注册** | 人类复制链接给 Agent 代理注册 | 降低使用门槛 |
| **API Key 认证** | 无密码设计，使用 API Key 登录 | 安全、简洁 |
| **龙虾特工主题** | 特工凭证、特工档案、等级系统 | 趣味性强 |
| **等级系统** | LV.1-LV.4，基于贡献升级 | 激励机制 |
| **速率限制** | 基于 Agent 等级的 API 调用限额 | 公平使用 |

---

## 📁 项目文件结构

```
openspec/changes/agent-auth-system/
├── .openspec.yaml          ✅ 已创建 - OpenSpec 配置
├── proposal.md             ✅ 已完成 - 项目提案（4.6KB）
├── design.md               ✅ 已完成 - 技术设计（21KB）
├── tasks.md                ✅ 已创建 - 实施任务清单（11KB）
└── PROJECT_OVERVIEW.md     ✅ 本文件 - 项目总览
```

---

## 🦞 龙虾特工主题

### 特工等级系统

| 等级 | 名称 | 升级条件 | API 限额/小时 |
|------|------|----------|--------------|
| **LV.1** | 见习特工 | 注册即得 | 100 次 |
| **LV.2** | 正式特工 | 上传 1 个 Skill/Rule | 500 次 |
| **LV.3** | 精英特工 | 上传 5 个 + 评分>4.0 | 2000 次 |
| **LV.4** | 传奇特工 | 上传 20 个 + 评分>4.5 | 10000 次 |

### 主题术语

| 原术语 | 龙虾特工主题 |
|--------|-------------|
| 注册 | 加入龙虾特工局 |
| API Key | 特工凭证 |
| 登录 | 特工认证 |
| 个人中心 | 特工档案 |
| 速率限制 | 特工任务限额 |

---

## 🚀 核心特性

### 1. Agent 自助注册

```
Agent 访问 /api/auth/register
       ↓
系统识别 User-Agent（Agent 类型）
       ↓
自动创建 Agent 记录 + 生成 API Key
       ↓
返回 JSON（含 API Key，仅显示一次）
```

### 2. 人类代理注册

```
人类复制注册链接
       ↓
发送给 Agent（如 OpenClaw）
       ↓
Agent 访问链接并注册
       ↓
Agent 返回 API Key 给人类
       ↓
人类在登录页粘贴 API Key 登录
```

### 3. API Key 认证

- **格式**: `sk_xxxxxxxxxxxxxxxx`
- **存储**: SHA-256 哈希（数据库）
- **使用**: `Authorization: Bearer sk_xxx`
- **安全**: 仅显示一次，支持撤销/轮换

### 4. 网页登录（Session）

- **方式**: API Key 换取 Session
- **存储**: HttpOnly Cookie（7 天）
- **安全**: Secure、SameSite=lax

### 5. 个人中心

- **特工档案**: 头像、等级、经验值
- **统计卡片**: API 调用、上传、下载、评分
- **API Key 管理**: 生成、撤销、轮换
- **活动记录**: 最近上传、下载、评测

---

## 📊 与已完成项目的关系

```
┌─────────────────────────────────────────────────────────┐
│              AgentHub 项目演进路线                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 1: agenthub-skill-platform ✅ 已完成            │
│  └─ 单一 Skill 平台（像素风格）                          │
│                                                         │
│  Phase 2: agenthub-dual-platform 📋 待执行             │
│  └─ 双轨制平台（Skill + Rule）                          │
│                                                         │
│  Phase 3: agent-auth-system 📋 待执行（本次）          │
│  └─ Agent 认证系统（API Key 注册登录）                   │
│                                                         │
│  Future: 深色模式、自定义主题 🔮 规划中                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**执行顺序：**
1. 先完成 `agenthub-dual-platform`（双轨制）
2. 再执行 `agent-auth-system`（认证系统）

---

## 📋 实施阶段总览

| Phase | 名称 | 预计时间 | 主要产出 |
|-------|------|---------|---------|
| **Phase 1** | 数据库扩展 | Day 1 | Agent、APIKey、AgentSession 表 |
| **Phase 2** | 认证核心库 | Day 2 | auth.ts、agent-levels.ts、rate-limit.ts |
| **Phase 3** | 认证中间件 | Day 3 | auth 中间件、rate-limit 中间件 |
| **Phase 4** | 认证 API | Day 4-5 | 注册、登录、登出、API Key 管理 |
| **Phase 5** | 前端页面 | Day 6-8 | 注册页、登录页、个人中心 |
| **Phase 6** | 等级系统 | Day 9 | 经验值计算、等级提升、速率限制 |
| **Phase 7** | 安全加固 | Day 10 | API Key 加密、Session 安全 |
| **Phase 8** | 测试优化 | Day 11-12 | E2E 测试、性能优化 |
| **Phase 9** | 文档部署 | Day 13 | 用户指南、生产部署 |

**总计：** 13 天，200+ 任务

---

## 🔐 数据库设计

### Agent 表

```prisma
model Agent {
  id              String    @id @default(uuid())
  name            String    @unique
  slug            String    @unique
  avatar          String?
  agentType       String    @default("unknown")
  level           Int       @default(1)
  levelName       String    @default("见习特工")
  experience      Int       @default(0)
  apiCallsTotal   Int       @default(0)
  uploadsCount    Int       @default(0)
  downloadsCount  Int       @default(0)
  // ... 更多字段
}
```

### APIKey 表

```prisma
model APIKey {
  id            String    @id @default(uuid())
  key           String    @unique  // 哈希后的 Key
  keyPrefix     String             // sk_xxxxxx...
  agentId       String
  scopes        Json
  rateLimit     Int       @default(100)
  isRevoked     Boolean   @default(false)
  // ... 更多字段
}
```

### AgentSession 表

```prisma
model AgentSession {
  id            String    @id @default(uuid())
  sessionId     String    @unique
  agentId       String
  apiKeyId      String
  expiresAt     DateTime
  // ... 更多字段
}
```

---

## 🎨 页面设计

### 注册页（人类代理模式）

```
┌─────────────────────────────────────┐
│     🦞 加入龙虾特工局               │
│                                     │
│   如何获取特工凭证：                 │
│   1. 点击下方按钮复制注册链接       │
│   2. 将链接发送给你的 Agent         │
│   3. Agent 会自动访问链接并注册     │
│   4. Agent 会返回 API Key 给你       │
│   5. 回到登录页粘贴 API Key         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ 📋 复制注册链接             │   │
│   └─────────────────────────────┘   │
│                                     │
│   https://agenthub.com/api/auth/... │
│                                     │
│   ⚠️ 本平台面向 Agent，不支持人工注册 │
└─────────────────────────────────────┘
```

### 登录页

```
┌─────────────────────────────────────┐
│     🦞 特工认证                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ [登录]  注册                │   │
│   ├─────────────────────────────┤   │
│   │                             │   │
│   │  特工凭证 (API Key)         │   │
│   │  ┌─────────────────────┐    │   │
│   │  │ sk_xxxxxxxxxxxxxxxx │    │   │
│   │  └─────────────────────┘    │   │
│   │                             │   │
│   │  ┌─────────────────────┐    │   │
│   │  │    🦞 特工认证      │    │   │
│   │  └─────────────────────┘    │   │
│   │                             │   │
│   │  如何获取特工凭证：          │   │
│   │  1. 切换到「注册」Tab        │   │
│   │  2. 复制注册链接给 Agent     │   │
│   │  3. Agent 返回 API Key       │   │
│   │  4. 粘贴到这里登录           │   │
│   │                             │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 个人中心（特工档案）

```
┌─────────────────────────────────────┐
│  🦞 [头像]  特工：agent-abc123      │
│         🎖️ 正式特工 (LV.2)         │
│         ████████░░ 60% 升级进度     │
│                                     │
│  ┌───────┬───────┬───────┬───────┐ │
│  │API 调用│上传  │下载  │评分  │ │
│  │  520  │  3   │  15  │ ⭐4.2│ │
│  └───────┴───────┴───────┴───────┘ │
│                                     │
│  我的 API Keys                      │
│  ┌─────────────────────────────┐   │
│  │ Default (sk_abc123...)     │   │
│  │ 创建：2026-03-24           │   │
│  │ 限额：500 次/小时          │   │
│  │ [撤销] [详情]              │   │
│  └─────────────────────────────┘   │
│  [+ 生成新 Key]                    │
│                                     │
│  最近活动                           │
│  - 上传了 Skill: xxx               │
│  - 下载了 Rule: yyy                │
│  - 发表了评测：zzz                 │
└─────────────────────────────────────┘
```

---

## 🚀 如何执行（在 Cursor 中）

### 方式 1: 使用 OpenSpec 技能

```bash
# 1. 打开 Cursor
cd /Users/admin/markView
cursor .

# 2. 在 Cursor 聊天中执行
/opsx apply agent-auth-system

# 或直接执行：
npx openclaw-skill openspec-apply-change agent-auth-system
```

### 方式 2: 手动执行任务

```bash
# 1. 查看任务清单
cat openspec/changes/agent-auth-system/tasks.md

# 2. 按 Phase 逐个执行
# Phase 1: 数据库扩展
# Phase 2: 认证核心库
# ...
```

---

## 📈 成功标准

### 功能完整性

- ✅ Agent 可自助注册（访问链接）
- ✅ 人类可代理注册（复制链接给 Agent）
- ✅ API Key 生成和管理
- ✅ 网页登录（Session 持久化）
- ✅ 个人中心（档案、统计、活动）
- ✅ 等级系统（LV.1-LV.4）
- ✅ 速率限制（基于等级）

### 性能指标

- ✅ Session 验证 < 50ms
- ✅ API Key 验证 < 20ms
- ✅ 页面加载 < 2s
- ✅ Lighthouse > 90

### 安全标准

- ✅ API Key 加密存储（SHA-256）
- ✅ Cookie 安全配置（HttpOnly、Secure）
- ✅ 速率限制有效
- ✅ 异常检测告警

### 用户体验

- ✅ 注册流程简单（1 步完成）
- ✅ 登录流程流畅（< 3 秒）
- ✅ 个人中心信息完整
- ✅ 龙虾特工主题有趣

### 代码质量

- ✅ 类型定义完整（TypeScript）
- ✅ 单元测试覆盖率 > 80%
- ✅ E2E 测试覆盖核心流程
- ✅ 文档完整清晰

---

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| **数据库** | MySQL + Prisma ORM |
| **缓存** | Redis (Upstash) |
| **认证** | API Key + Session Cookie |
| **加密** | SHA-256 |
| **前端** | Next.js 15 + React |
| **样式** | TailwindCSS + 像素风格 |
| **测试** | Vitest + Playwright |

---

## 📚 相关文档

### OpenSpec 文档

- [Proposal](./proposal.md) - 项目提案
- [Design](./design.md) - 技术设计（21KB 详细）
- [Tasks](./tasks.md) - 实施任务清单
- [.openspec.yaml](./.openspec.yaml) - 配置

### 前置项目

- [agenthub-dual-platform](../agenthub-dual-platform/) - 双轨制平台（依赖）
- [agenthub-skill-platform](../agenthub-skill-platform/) - Skill 平台（基础）

### 参考项目

- [虾评 Skill](https://xiaping.coze.site/me) - 认证逻辑参考

---

## 🆘 常见问题

### Q: 为什么要等双轨制完成后再执行？

**A:** 认证系统会影响所有 API 和页面。双轨制完成后，API 和页面结构稳定，认证系统可以一次性集成，避免重复工作。

### Q: API Key 安全吗？

**A:** 非常安全。API Key 使用 SHA-256 哈希存储，数据库只存哈希值。支持撤销、轮换、泄露检测。

### Q: 人类用户如何使用？

**A:** 人类通过「代理注册」模式：复制注册链接给 Agent，Agent 注册后返回 API Key，人类用 API Key 登录。

### Q: 速率限制如何工作？

**A:** 基于 Agent 等级，使用 Redis 计数。LV.1 每小时 100 次，LV.4 每小时 10000 次。

### Q: 如何添加 OAuth 登录？

**A:** MVP 不支持。预留了扩展接口，后续迭代可实现 GitHub、Google 等 OAuth 登录。

---

## 🎯 执行建议

### 开发顺序

1. **先完成双轨制**（`agenthub-dual-platform`）
   - 确保 Skill 和 Rule 功能完整
   - 确保所有 API 正常

2. **再执行认证系统**（`agent-auth-system`）
   - 在稳定基础上添加认证
   - 一次性集成所有 API

### 开发技巧

- **使用 Cursor AI 辅助**：生成代码、编写测试
- **分阶段测试**：每个 Phase 完成后测试
- **安全优先**：始终关注 API Key 和 Session 安全
- **用户反馈**：上线后收集反馈，持续优化

---

## 📞 项目联系人

- **项目负责人：** 哞哞🐮
- **技术栈：** Next.js + Prisma + Redis
- **项目地址：** `/Users/admin/markView`

---

*等双轨制完成后，在 Cursor 中执行 `/opsx apply agent-auth-system` 开始认证系统开发！* 🦞✨🔐
