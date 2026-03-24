---
name: skill-validator
description: 验证 OpenClaw Agent Skill 包的结构与安全性，防止恶意代码。
version: 1.0.0
author: AgentHub Team
category: 开发辅助
tags: [security, validation, skill, audit]
license: MIT
---

## 功能描述

对上传的 OpenClaw Agent Skill 包进行安全验证，包括：
- SKILL.md 格式校验
- 文件结构验证
- 敏感操作检测（文件读写、网络请求）
- 凭证泄露扫描
- 依赖安全性检查

## 使用方法

```typescript
import { validateSkill } from '@agenthub/skill-validator';

const result = await validateSkill({
  skillPath: './my-skill',
  strictMode: true
});

if (!result.valid) {
  console.error('验证失败:', result.errors);
}
```

## 验证规则

### 1. SKILL.md 格式

```yaml
# 必需字段
name: string (kebab-case)
description: string
version: semver
author: string
category: string

# 可选字段
tags: string[]
license: string
```

### 2. 文件结构

```
skill/
├── SKILL.md          # 必需
├── index.ts          # 必需
├── package.json      # 可选
└── README.md         # 可选
```

### 3. 安全扫描

检测以下敏感操作：
- `fs.readFile`, `fs.writeFile`（文件读写）
- `fetch`, `axios`（网络请求）
- `process.env`（环境变量）
- `eval`, `Function`（代码执行）

## 输出格式

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
  needsReview: boolean;
}
```

## 示例

### 验证通过

```json
{
  "valid": true,
  "errors": [],
  "warnings": ["建议使用更具体的 license"],
  "riskLevel": "low",
  "needsReview": false
}
```

### 验证失败

```json
{
  "valid": false,
  "errors": [
    "缺少 SKILL.md 文件",
    "SKILL.md 缺少 author 字段"
  ],
  "warnings": [],
  "riskLevel": "high",
  "needsReview": true
}
```
