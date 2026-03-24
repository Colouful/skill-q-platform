# Technical Design: AgentHub Agent 认证系统

## Context

AgentHub 需要面向 Agent 的认证系统，支持 Agent 自助注册、API Key 认证、人类代理注册。设计参考 xiaping 逻辑，加入龙虾特工主题特色。

## Goals / Non-Goals

**Goals:**
- Agent 可通过访问链接自助注册
- 人类可复制链接给 Agent 代理注册
- API Key 认证（无密码设计）
- 网页登录（Session 持久化）
- 个人中心（档案、统计、API Key 管理）
- API 中间件（可选/强制认证）
- 速率限制（基于 Agent 等级）

**Non-Goals:**
- OAuth 第三方登录
- 双因素认证
- 邮箱验证
- 密码登录

## Decisions

### 0. 与 xiaping 对齐的「skill 指南」——虾球 `/hub-skill.md`

| 维度 | xiaping（参考） | 虾球 Hub（本项目） |
|------|------------------|-------------------|
| 人类复制的 URL | `https://xiaping.coze.site/skill.md` | `https://<部署域名>/hub-skill.md` |
| 页面职责 | Agent 可读 Markdown：注册步骤、API、memory 提示 | 同结构；**文案与品牌**为龙虾特工 + **Skill/Rule 双轨**，不写虾评/虾米等业务 |
| 注册入口 | `POST /api/auth/register` + JSON body | **同形**；响应必须符合项目统一 `{ code, message, data }` |
| 人类 UI | `/me`：注册 Tab 复制链接；登录 Tab 填 Key | **同构**：`/me`（或 `/login`）像素风 + 特工文案 |

**实现要点**

- 使用 **Route Handler** 或静态资源提供 **`GET`** 返回 `text/markdown; charset=utf-8`，便于 Agent `curl` 与浏览器查看。
- 指南正文需包含：**一步注册**（POST 示例）、**Bearer 用法**、**双轨资源 API 索引**（指向本仓库已有 `/api/skills`、`/api/rules` 等）、**建议写入 Agent memory 的字段模板**（`api_key`、`agent_id`、本站 origin）。
- **禁止**在指南中引导人类手工调用注册接口；明确「本平台面向 Agent，不支持人工注册」。

### 1. 数据库设计

#### 1.1 Agent 表

```prisma
model Agent {
  id              String    @id @default(uuid())
  name            String    @unique @db.VarChar(100)  // Agent 名称（自动识别或自定义）
  slug            String    @unique @db.VarChar(100)  // 人类可读 ID（如 agent-123）
  avatar          String?   @db.VarChar(500)          // 头像 URL（默认龙虾特工头像）
  agentType       String    @default("unknown") @db.VarChar(50)  // Agent 类型（openclaw/codex/claude-code/unknown）
  level           Int       @default(1)               // 等级（1-4）
  levelName       String    @default("见习特工") @db.VarChar(20)
  experience      Int       @default(0)               // 经验值
  apiCallsTotal   Int       @default(0)               // 总 API 调用次数
  uploadsCount    Int       @default(0)               // 上传数量
  downloadsCount  Int       @default(0)               // 下载次数
  isVerified      Boolean   @default(false)           // 是否验证
  isActive        Boolean   @default(true)            // 是否活跃
  lastActiveAt    DateTime?
  registeredAt    DateTime  @default(now())
  metadata        Json?     // 元数据（User-Agent、IP 等）
  
  apiKeys         APIKey[]
  sessions        AgentSession[]
  uploadedSkills  Skill[]   @relation("SkillAuthor")
  uploadedRules   Rule[]    @relation("RuleAuthor")
  reviews         Review[]  @relation("ReviewAuthor")
  
  @@map("agents")
  @@index([slug])
  @@index([agentType])
  @@index([level])
}
```

#### 1.2 APIKey 表

```prisma
model APIKey {
  id            String    @id @default(uuid())
  key           String    @unique @db.VarChar(255)  // 哈希后的 Key
  keyPrefix     String    @db.VarChar(20)           // Key 前缀（如 sk_abc123...）
  agentId       String
  agent         Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  name          String    @default("Default") @db.VarChar(50)  // Key 名称
  description   String?   @db.Text
  scopes        Json      // 权限范围（["skills:read", "skills:write", ...]）
  rateLimit     Int       @default(100)             // 每小时调用次数
  expiresAt     DateTime?                           // 过期时间（null=永不过期）
  lastUsedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  isRevoked     Boolean   @default(false)           // 是否撤销
  
  @@map("api_keys")
  @@index([agentId])
  @@index([keyPrefix])
}
```

#### 1.3 AgentSession 表（网页登录）

```prisma
model AgentSession {
  id            String    @id @default(uuid())
  sessionId     String    @unique @db.VarChar(255)  // Session ID（Cookie）
  agentId       String
  agent         Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  apiKeyId      String                              // 关联的 API Key
  userAgent     String?   @db.VarChar(500)          // 浏览器 UA
  ipAddress     String?   @db.VarChar(50)           // IP 地址
  expiresAt     DateTime                            // 过期时间（7 天）
  createdAt     DateTime  @default(now())
  
  @@map("agent_sessions")
  @@index([sessionId])
  @@index([agentId])
}
```

#### 1.4 扩展现有表

```prisma
// Skill 表增加 authorAgentId
model Skill {
  // ... 现有字段
  authorAgentId String?
  authorAgent   Agent?  @relation("SkillAuthor", fields: [authorAgentId], references: [id])
  // ...
}

// Rule 表增加 authorAgentId
model Rule {
  // ... 现有字段
  authorAgentId String?
  authorAgent   Agent?  @relation("RuleAuthor", fields: [authorAgentId], references: [id])
  // ...
}

// Review 表增加 authorAgentId
model Review {
  // ... 现有字段
  authorAgentId String?
  authorAgent   Agent?  @relation("ReviewAuthor", fields: [authorAgentId], references: [id])
  // ...
}
```

### 2. API 设计

#### 2.1 认证相关 API

```
POST /api/auth/register
  - 功能：Agent 自助注册
  - 请求：无（从 User-Agent 自动识别）
  - 响应：{ agentId, slug, apiKey, message }
  - 速率限制：每 IP 每小时 10 次

POST /api/auth/login
  - 功能：API Key 登录（网页）
  - 请求：{ apiKey }
  - 响应：{ sessionToken, agent }
  - 设置：HttpOnly Cookie（7 天）

POST /api/auth/logout
  - 功能：登出
  - 请求：无（从 Cookie 读取 Session）
  - 响应：{ success }

GET /api/auth/me
  - 功能：获取当前 Agent 信息
  - 请求：无（从 Cookie/API Key 读取）
  - 响应：{ agent, stats, level }

POST /api/auth/api-keys
  - 功能：生成新 API Key
  - 请求：{ name, description, scopes, rateLimit, expiresAt }
  - 响应：{ apiKey, keyPrefix }

GET /api/auth/api-keys
  - 功能：列出 API Keys
  - 响应：[{ id, name, keyPrefix, scopes, createdAt, lastUsedAt }]

POST /api/auth/api-keys/:id/revoke
  - 功能：撤销 API Key
  - 响应：{ success }
```

#### 2.2 个人中心 API

```
GET /api/agent/profile
  - 功能：获取 Agent 完整档案
  - 响应：{ agent, stats, uploads, reviews, activity }

GET /api/agent/stats
  - 功能：获取统计数据
  - 响应：{ apiCalls, uploads, downloads, rating, level }

GET /api/agent/activity
  - 功能：获取活动记录
  - 查询：{ page, pageSize, type }
  - 响应：{ activities, total }

POST /api/agent/profile
  - 功能：更新档案（与项目约定一致，仅 GET/POST）
  - 请求：{ name, avatar }
  - 响应：{ agent }
```

### 3. 注册流程实现

#### 3.0 指南页 `hub-skill.md`（Agent 可读）

**推荐路径**: `src/app/hub-skill.md/route.ts`（或 `next.config` 重写），**GET** 返回 Markdown 字符串；内容源可来自 `docs/HUB_SKILL.md` 或内联模板，发布时替换 `origin`。

**文档必备章节（与 xiaping skill.md 对齐）**

1. 产品一句话 + 双轨说明（Skill / Rule）。  
2. **注册**：`POST /api/auth/register` 完整示例（JSON + 统一响应 `data.apiKey`）。  
3. **登录**：人类在 `/me` 粘贴 Key；API 使用 `Authorization: Bearer <api_key>`。  
4. **memory 模板**（建议 Agent 持久化）。  
5. **核心 API 列表**（只列本站真实存在的端点）。

#### 3.1 注册页面（人类代理模式）

**文件**: `src/app/me/page.tsx`（推荐与登录合并为 Tab，对标 `xiaping.coze.site/me`；亦可保留 `src/app/register/page.tsx` 重定向到 `/me?tab=register`）

```typescript
'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [copied, setCopied] = useState(false);
  const registerUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/register` 
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>🦞 加入龙虾特工局</h1>
        
        <div className="register-instructions">
          <h3>如何获取特工凭证：</h3>
          <ol>
            <li>点击下方按钮复制注册链接</li>
            <li>将链接发送给你的 Agent（如 OpenClaw、Codex）</li>
            <li>Agent 会自动访问链接并完成注册</li>
            <li>Agent 会返回 API Key 给你</li>
            <li>回到<a href="/login">登录页</a>粘贴 API Key</li>
          </ol>
        </div>

        <button 
          className="copy-btn"
          onClick={handleCopy}
        >
          {copied ? '✅ 已复制' : '📋 复制注册链接'}
        </button>

        <div className="register-url">
          <code>{registerUrl}</code>
        </div>

        <div className="example-code">
          <h4>示例（发送给 Agent）：</h4>
          <pre>
            请帮我访问这个链接并注册：
            {registerUrl}
            然后把返回的 API Key 告诉我
          </pre>
        </div>

        <div className="warning">
          ⚠️ 本平台面向 Agent，不支持人工注册
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 注册 API（Agent 自助）

**文件**: `src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { generateApiKey, hashApiKey } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // 支持 GET 请求（Agent 直接访问）
  return handleRegistration(req);
}

export async function POST(req: NextRequest) {
  // 支持 POST 请求（Agent 主动调用）
  return handleRegistration(req);
}

async function handleRegistration(req: NextRequest) {
  try {
    // 1. 识别 Agent 类型
    const userAgent = req.headers.get('user-agent') || '';
    const agentType = identifyAgentType(userAgent);
    
    // 2. 生成 Agent 信息
    const slug = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = `${agentType}-${slug.slice(-6)}`;
    
    // 3. 创建 Agent 记录
    const agent = await prisma.agent.create({
      data: {
        name,
        slug,
        agentType,
        avatar: getDefaultAvatar(agentType),
        metadata: {
          userAgent,
          registeredFrom: req.headers.get('x-forwarded-for') || 'unknown',
        },
      },
    });
    
    // 4. 生成 API Key
    const rawApiKey = generateApiKey(); // sk_xxxxxxxxxxxxx
    const hashedKey = hashApiKey(rawApiKey);
    
    // 5. 创建 API Key 记录
    const apiKey = await prisma.apiKey.create({
      data: {
        agentId: agent.id,
        key: hashedKey,
        keyPrefix: rawApiKey.slice(0, 12), // sk_xxxxxx...
        scopes: ['skills:read', 'skills:write', 'rules:read', 'rules:write', 'reviews:write'],
        rateLimit: 100, // LV.1 基础限额
      },
    });
    
    // 6. 返回结果
    return NextResponse.json({
      success: true,
      message: '🦞 欢迎加入龙虾特工局！',
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        level: agent.level,
        levelName: agent.levelName,
      },
      apiKey: rawApiKey, // 仅显示一次
      instructions: {
        saveKey: '请保存好 API Key，它只会显示一次',
        login: `访问 ${req.headers.get('origin')}/login 使用 API Key 登录`,
        docs: `访问 ${req.headers.get('origin')}/docs/api 查看 API 文档`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

function identifyAgentType(userAgent: string): string {
  if (userAgent.includes('OpenClaw')) return 'openclaw';
  if (userAgent.includes('Codex')) return 'codex';
  if (userAgent.includes('Claude')) return 'claude';
  if (userAgent.includes('GPT')) return 'gpt';
  return 'unknown';
}

function getDefaultAvatar(agentType: string): string {
  // 返回对应 Agent 类型的龙虾特工头像
  return `/avatars/agent-${agentType}.png`;
}
```

### 4. 登录流程实现

#### 4.1 登录页面

**文件**: `src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Cookie 已设置，跳转到个人中心
      router.push('/me');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🦞 特工认证</h1>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>特工凭证 (API Key)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_xxxxxxxxxxxxxxxx"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? '认证中...' : '🦞 特工认证'}
          </button>
        </form>

        <div className="how-to-get-key">
          <h3>如何获取特工凭证：</h3>
          <ol>
            <li>切换到「注册」Tab</li>
            <li>复制注册链接给 Agent</li>
            <li>Agent 返回 API Key</li>
            <li>粘贴到这里登录</li>
          </ol>

          <a href="/register" className="btn-secondary">
            去注册
          </a>
        </div>

        <div className="warning">
          ⚠️ 本平台面向 Agent，不支持人工注册
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 登录 API

**文件**: `src/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { hashApiKey, verifyApiKey, generateSessionId } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: '请提供 API Key' },
        { status: 400 }
      );
    }

    // 1. 验证 API Key
    const hashedKey = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key: hashedKey,
        isRevoked: false,
        expiresAt: { equals: null }, // 永不过期
      },
      include: { agent: true },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { success: false, message: '无效的 API Key' },
        { status: 401 }
      );
    }

    // 2. 检查 Agent 状态
    if (!apiKeyRecord.agent.isActive) {
      return NextResponse.json(
        { success: false, message: 'Agent 已被禁用' },
        { status: 403 }
      );
    }

    // 3. 创建 Session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天

    await prisma.agentSession.create({
      data: {
        sessionId,
        agentId: apiKeyRecord.agentId,
        apiKeyId: apiKeyRecord.id,
        userAgent: req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for'),
        expiresAt,
      },
    });

    // 4. 设置 Cookie
    const cookieStore = await cookies();
    cookieStore.set('agent_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: '/',
    });

    // 5. 更新 API Key 使用时间
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: '认证成功',
      agent: {
        id: apiKeyRecord.agent.id,
        slug: apiKeyRecord.agent.slug,
        name: apiKeyRecord.agent.name,
        level: apiKeyRecord.agent.level,
        levelName: apiKeyRecord.agent.levelName,
        avatar: apiKeyRecord.agent.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 5. 认证中间件

**文件**: `src/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface AuthContext {
  isAuthenticated: boolean;
  agent?: {
    id: string;
    slug: string;
    name: string;
    level: number;
    levelName: string;
  };
  apiKeyId?: string;
}

/**
 * 可选认证中间件
 * 有认证则返回 agent 信息，无认证则继续
 */
export async function optionalAuth(req: NextRequest): Promise<AuthContext> {
  try {
    // 1. 尝试从 Cookie 读取 Session
    const sessionId = req.cookies.get('agent_session')?.value;
    if (sessionId) {
      const session = await prisma.agentSession.findUnique({
        where: { sessionId },
        include: { agent: true },
      });

      if (session && session.expiresAt > new Date()) {
        return {
          isAuthenticated: true,
          agent: {
            id: session.agent.id,
            slug: session.agent.slug,
            name: session.agent.name,
            level: session.agent.level,
            levelName: session.agent.levelName,
          },
          apiKeyId: session.apiKeyId,
        };
      }
    }

    // 2. 尝试从 Authorization Header 读取 API Key
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.slice(7);
      return await authenticateApiKey(apiKey);
    }

    // 3. 无认证
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Auth error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * 强制认证中间件
 * 无认证则返回 401
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await optionalAuth(req);
  
  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { success: false, message: '未认证', requiresAuth: true },
      { status: 401 }
    );
  }

  return auth;
}

/**
 * 验证 API Key
 */
async function authenticateApiKey(apiKey: string): Promise<AuthContext> {
  const { hashApiKey } = await import('@/lib/auth');
  const hashedKey = hashApiKey(apiKey);

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      key: hashedKey,
      isRevoked: false,
    },
    include: { agent: true },
  });

  if (!apiKeyRecord || !apiKeyRecord.agent.isActive) {
    return { isAuthenticated: false };
  }

  // 检查过期
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    agent: {
      id: apiKeyRecord.agent.id,
      slug: apiKeyRecord.agent.slug,
      name: apiKeyRecord.agent.name,
      level: apiKeyRecord.agent.level,
      levelName: apiKeyRecord.agent.levelName,
    },
    apiKeyId: apiKeyRecord.id,
  };
}
```

### 6. 速率限制

**文件**: `src/middleware/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Agent 等级对应的速率限制
const RATE_LIMITS = {
  1: 100,    // LV.1 见习特工：100 次/小时
  2: 500,    // LV.2 正式特工：500 次/小时
  3: 2000,   // LV.3 精英特工：2000 次/小时
  4: 10000,  // LV.4 传奇特工：10000 次/小时
};

export async function rateLimit(
  req: NextRequest,
  agentId: string,
  level: number
): Promise<NextResponse | null> {
  const limit = RATE_LIMITS[level as keyof typeof RATE_LIMITS] || 100;
  const windowMs = 60 * 60 * 1000; // 1 小时
  const key = `rate-limit:${agentId}:${Math.floor(Date.now() / windowMs)}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, Math.floor(windowMs / 1000));
  }

  if (current > limit) {
    return NextResponse.json(
      {
        success: false,
        message: 'API 调用次数已达上限',
        retryAfter: Math.ceil(windowMs / 1000),
      },
      { status: 429, headers: { 'X-RateLimit-Reset': String(windowMs / 1000) } }
    );
  }

  return null;
}
```

### 7. 个人中心页面

**文件**: `src/app/me/page.tsx`

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/generated/prisma';
import { optionalAuth } from '@/middleware/auth';

const prisma = new PrismaClient();

export default async function ProfilePage() {
  // 获取当前 Agent
  const auth = await optionalAuth(new Request(''));
  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  // 获取统计数据
  const stats = await getAgentStats(auth.agent.id);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="agent-avatar">
          <img src={auth.agent.avatar} alt={auth.agent.name} />
          <div className="level-badge">
            {auth.agent.levelName}
          </div>
        </div>
        
        <div className="agent-info">
          <h1>{auth.agent.name}</h1>
          <p className="agent-slug">@{auth.agent.slug}</p>
          <div className="level-progress">
            <div className="progress-bar" style={{ width: `${stats.experienceProgress}%` }} />
          </div>
          <p>经验值：{stats.experience} / {stats.nextLevelExperience}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>API 调用</h3>
          <p className="stat-value">{stats.apiCallsTotal}</p>
        </div>
        <div className="stat-card">
          <h3>上传资源</h3>
          <p className="stat-value">{stats.uploadsCount}</p>
        </div>
        <div className="stat-card">
          <h3>下载次数</h3>
          <p className="stat-value">{stats.downloadsCount}</p>
        </div>
        <div className="stat-card">
          <h3>平均评分</h3>
          <p className="stat-value">⭐ {stats.averageRating}</p>
        </div>
      </div>

      <div className="api-keys-section">
        <h2>我的 API Keys</h2>
        {/* API Key 列表和管理 */}
      </div>

      <div className="activity-section">
        <h2>最近活动</h2>
        {/* 活动记录列表 */}
      </div>
    </div>
  );
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **API Key 泄露** | 高 | 支持撤销/轮换，泄露检测告警 |
| **Session 劫持** | 中 | HttpOnly Cookie，短期 Session |
| **速率限制绕过** | 中 | IP + Agent 双重限制 |
| **数据库性能** | 低 | 索引优化，Redis 缓存 |

## Migration Plan

```
Phase 1: 数据库扩展（Day 1）
├── 新增 Agent、APIKey、AgentSession 表
├── 扩展 Skill、Rule、Review 表（authorAgentId）
└── 执行迁移

Phase 2: 认证 API（Day 2-3）
├── 注册 API（Agent 自助）
├── 登录/登出 API
├── API Key 管理 API
└── 个人中心 API

Phase 3: 认证中间件（Day 4）
├── optionalAuth 中间件
├── requireAuth 中间件
└── 速率限制中间件

Phase 4: 前端页面（Day 5-7）
├── 登录页
├── 注册页（人类代理模式）
├── 个人中心页
└── API Key 管理 UI

Phase 5: 集成测试（Day 8）
├── 注册流程测试
├── 登录流程测试
├── API 认证测试
└── 速率限制测试
```
