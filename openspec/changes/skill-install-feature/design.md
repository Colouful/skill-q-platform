# Design: Skill 便捷安装功能

## Overview

在 Skill 详情页增加「安装方式」模块，提供 Agent 安装提示和终端脚本安装两种模式，降低 Skill 安装门槛，提升用户体验。

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Skill Detail Page                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              安装方式模块 (新增)                         │   │
│  │  ┌──────────────┬──────────────┐                        │   │
│  │  │  🤖 我是 Agent │  👤 我是 Human │  ← 模式切换 Tab       │   │
│  │  └──────────────┴──────────────┘                        │   │
│  │                                                          │   │
│  │  [Agent 模式]                                            │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 将此提示发送给你的 Agent，以安装 SkillHub CLI        │ │   │
│  │  │ ┌──────────────────────────────────────────────┐   │ │   │
│  │  │ │ 请先检查是否已安装 SkillHub 商店...            │ 📋│ │   │
│  │  │ │ 若已安装，则直接安装 github 技能。              │   │ │   │
│  │  │ └──────────────────────────────────────────────┘   │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  [Human 模式]                                            │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 在终端中执行以下命令，即可安装 SkillHub CLI          │ │   │
│  │  │ ┌──────────────────────────────────────────────┐   │ │   │
│  │  │ │ $ curl -fsSL https://.../install.sh | bash   │ 📋│ │   │
│  │  │ └──────────────────────────────────────────────┘   │ │   │
│  │  │                                                      │ │   │
│  │  │ 安装完 CLI 后，安装技能                               │ │   │
│  │  │ ┌──────────────────────────────────────────────┐   │ │   │
│  │  │ │ $ skillhub install github                    │ 📋│ │   │
│  │  │ └──────────────────────────────────────────────┘   │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### 无需修改数据库

安装信息从现有 Skill 字段动态生成：
- `slug` → 用于 `skillhub install <slug>` 命令
- `name` → 用于安装提示文本
- `description` → 可选用于安装提示

### 新增 API 响应结构

```typescript
// GET /api/skills/[slug]/install-info
interface SkillInstallInfo {
  skill: {
    slug: string;      // 用于 CLI 安装命令
    name: string;      // 用于提示文本
    description: string; // 用于提示文本
  };
  installScript: {
    baseUrl: string;   // 安装脚本基础 URL（从环境变量读取）
    cliInstallCmd: string;  // 完整 CLI 安装命令
    cliInstallCmdWithAccelerator: string; // 带加速的安装命令
  };
  agentPrompt: {
    basic: string;     // 基础安装提示（仅 CLI）
    withAccelerator: string; // 带加速的安装提示
  };
  cliInstallCmd: string; // skillhub install <slug> 命令
}
```

## API Design

### GET /api/skills/[slug]/install-info

获取 Skill 安装信息

**Request:**
```http
GET /api/skills/github/install-info
```

**Response:**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "skill": {
      "slug": "github",
      "name": "GitHub 技能",
      "description": "GitHub 相关操作技能"
    },
    "installScript": {
      "baseUrl": "https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install",
      "cliInstallCmd": "curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --no-skills",
      "cliInstallCmdWithAccelerator": "curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash"
    },
    "agentPrompt": {
      "basic": "请先检查是否已安装 SkillHub 商店，若未安装，请根据 https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/skillhub.md 安装 SkillHub 商店，但是只安装 CLI，然后安装 github 技能。\n\n若已安装，则直接安装 github 技能。",
      "withAccelerator": "请先检查是否已安装 SkillHub 商店，若未安装，请根据 https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/skillhub.md 安装 SkillHub 商店，然后安装 github 技能。\n\n若已安装，则直接安装 github 技能。"
    },
    "cliInstallCmd": "skillhub install github"
  }
}
```

**Error Response:**
```json
{
  "code": 404,
  "message": "Skill 不存在",
  "data": null
}
```

### 环境变量配置

```bash
# .env / .env.production
SKILLHUB_INSTALL_BASE_URL=https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install
SKILLHUB_CLI_NAME=skillhub
```

## Component Design

### InstallModeTabs

安装模式切换组件

```typescript
interface InstallModeTabsProps {
  mode: 'agent' | 'human';
  onModeChange: (mode: 'agent' | 'human') => void;
}
```

**UI:**
- 两个 Tab：「🤖 我是 Agent」和「👤 我是 Human」
- 选中状态高亮显示
- 点击切换模式

### AgentInstallPrompt

Agent 安装提示组件

```typescript
interface AgentInstallPromptProps {
  promptText: string;
  onCopy: () => void;
  copied: boolean;
}
```

**UI:**
- 提示文本区域（多行）
- 右侧复制按钮（📋 图标）
- 复制成功后显示「已复制」提示（2 秒后恢复）

### HumanInstallScript

Human 终端脚本组件

```typescript
interface HumanInstallScriptProps {
  title: string;
  command: string;
  onCopy: () => void;
  copied: boolean;
}
```

**UI:**
- 标题（如「在终端中执行以下命令，即可安装 SkillHub CLI」）
- 代码块（深色背景，等宽字体）
- 右侧复制按钮（📋 图标）
- 复制成功后显示「已复制」提示（2 秒后恢复）

### SkillInstallSection

安装方式主模块（集成以上组件）

```typescript
interface SkillInstallSectionProps {
  skillSlug: string;
}
```

**State:**
- `mode`: 'agent' | 'human' - 当前模式
- `installInfo`: SkillInstallInfo | null - 安装信息
- `loading`: boolean - 加载状态
- `copiedAgent`: boolean - Agent 提示复制状态
- `copiedCli`: boolean - CLI 安装命令复制状态
- `copiedSkill`: boolean - 技能安装命令复制状态

**Effect:**
- 组件挂载时调用 `GET /api/skills/[slug]/install-info` 获取安装信息

## Implementation Details

### 1. API Route Handler

```typescript
// src/app/api/skills/[slug]/install-info/route.ts
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { MODERATION_STATUS } from "@/lib/moderation";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  
  const skill = await prisma.skill.findUnique({
    where: { slug, moderationStatus: MODERATION_STATUS.PUBLISHED },
    select: { slug: true, name: true, description: true },
  });
  
  if (!skill) {
    return jsonErr("Skill 不存在", 404);
  }
  
  const baseUrl = process.env.SKILLHUB_INSTALL_BASE_URL 
    || "https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install";
  const cliName = process.env.SKILLHUB_CLI_NAME || "skillhub";
  
  return jsonOk({
    skill,
    installScript: {
      baseUrl,
      cliInstallCmd: `curl -fsSL ${baseUrl}/install.sh | bash -s -- --no-skills`,
      cliInstallCmdWithAccelerator: `curl -fsSL ${baseUrl}/install.sh | bash`,
    },
    agentPrompt: {
      basic: `请先检查是否已安装 SkillHub 商店，若未安装，请根据 ${baseUrl}/skillhub.md 安装 SkillHub 商店，但是只安装 CLI，然后安装${skill.slug}技能。\n\n若已安装，则直接安装${skill.slug}技能。`,
      withAccelerator: `请先检查是否已安装 SkillHub 商店，若未安装，请根据 ${baseUrl}/skillhub.md 安装 SkillHub 商店，然后安装${skill.slug}技能。\n\n若已安装，则直接安装${skill.slug}技能。`,
    },
    cliInstallCmd: `${cliName} install ${skill.slug}`,
  });
}
```

### 2. Frontend Component

```typescript
// src/components/skill/skill-install-section.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InstallModeTabs } from "./install-mode-tabs";
import { AgentInstallPrompt } from "./agent-install-prompt";
import { HumanInstallScript } from "./human-install-script";
import { fetchApi } from "@/lib/client-api";

interface SkillInstallInfo {
  skill: { slug: string; name: string; description: string };
  installScript: {
    baseUrl: string;
    cliInstallCmd: string;
    cliInstallCmdWithAccelerator: string;
  };
  agentPrompt: {
    basic: string;
    withAccelerator: string;
  };
  cliInstallCmd: string;
}

export function SkillInstallSection({ skillSlug }: { skillSlug: string }) {
  const [mode, setMode] = useState<'agent' | 'human'>('agent');
  const [installInfo, setInstallInfo] = useState<SkillInstallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAgent, setCopiedAgent] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedSkill, setCopiedSkill] = useState(false);

  useEffect(() => {
    async function loadInstallInfo() {
      const res = await fetchApi<SkillInstallInfo>(`/api/skills/${skillSlug}/install-info`);
      if (res.code === 0 && res.data) {
        setInstallInfo(res.data);
      }
      setLoading(false);
    }
    loadInstallInfo();
  }, [skillSlug]);

  const copyToClipboard = async (text: string, setState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setState(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setState(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted/20 rounded-lg" />;
  }

  if (!installInfo) {
    return null;
  }

  return (
    <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
      <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)] mb-4">
        安装方式
      </h2>
      
      <InstallModeTabs mode={mode} onModeChange={setMode} />
      
      <div className="mt-4 space-y-4">
        {mode === 'agent' ? (
          <AgentInstallPrompt
            promptText={installInfo.agentPrompt.basic}
            onCopy={() => copyToClipboard(installInfo.agentPrompt.basic, setCopiedAgent)}
            copied={copiedAgent}
          />
        ) : (
          <>
            <HumanInstallScript
              title="在终端中执行以下命令，即可安装 SkillHub CLI"
              command={installInfo.installScript.cliInstallCmd}
              onCopy={() => copyToClipboard(installInfo.installScript.cliInstallCmd, setCopiedCli)}
              copied={copiedCli}
            />
            <HumanInstallScript
              title="在终端中执行以下命令，即可安装 SkillHub CLI，并且优先采用 SkillHub 加速安装技能"
              command={installInfo.installScript.cliInstallCmdWithAccelerator}
              onCopy={() => copyToClipboard(installInfo.installScript.cliInstallCmdWithAccelerator, setCopiedCli)}
              copied={copiedCli}
            />
            <HumanInstallScript
              title="安装完 CLI 后，安装技能"
              command={installInfo.cliInstallCmd}
              onCopy={() => copyToClipboard(installInfo.cliInstallCmd, setCopiedSkill)}
              copied={copiedSkill}
            />
          </>
        )}
      </div>
    </section>
  );
}
```

## UI/UX Design

### 像素风格设计

- **边框**: 4px 像素边框 (`border-4 border-[var(--pixel-border)]`)
- **阴影**: 硬阴影 (`shadow-[4px_4px_0_0_var(--pixel-border)]`)
- **字体**: 标题使用像素字体 (`font-[family-name:var(--font-pixel-heading)]`)
- **代码块**: 深色背景 (`bg-[#1a1a2e]`)，等宽字体
- **按钮**: 像素风格复制按钮，hover 时位移效果

### 响应式设计

- **桌面端**: 完整展示所有安装指令
- **移动端**: 代码块横向滚动，复制按钮固定在右侧

## Testing Strategy

### Unit Tests

- `install-info` API 返回正确格式
- 环境变量缺失时使用默认值
- Skill 不存在时返回 404

### Component Tests

- 模式切换功能正常
- 复制功能正常（mock navigator.clipboard）
- 加载状态正确显示
- 错误状态正确处理

### E2E Tests

- 访问 Skill 详情页，安装模块正确加载
- 切换模式，内容正确更新
- 点击复制，剪贴板内容正确

## Rollout Plan

### Phase 1: 基础功能
- 实现 API 接口
- 实现前端组件
- 集成到 Skill 详情页

### Phase 2: 优化体验
- 添加加载骨架屏
- 添加复制成功动画
- 添加错误处理

### Phase 3: 数据追踪（后续）
- 添加安装按钮点击统计
- 添加安装转化率分析
