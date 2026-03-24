---
name: zip-handler
description: 处理 ZIP 文件的打包与解压，支持 Skill 包上传下载。
version: 1.0.0
author: AgentHub Team
category: 开发辅助
tags: [zip, file, upload, download]
license: MIT
---

## 功能描述

提供 ZIP 文件的打包与解压功能，适用于：
- Skill 包上传（解压 + 校验）
- Skill 包下载（打包 + 压缩）
- 批量文件处理

## 使用方法

### 解压 ZIP

```typescript
import { unzipSkill } from '@agenthub/zip-handler';

const files = await unzipSkill({
  zipBuffer: zipData,
  validate: true  // 同时验证 SKILL.md
});

// 输出：
// [
//   { name: 'SKILL.md', content: '...' },
//   { name: 'index.ts', content: '...' }
// ]
```

### 打包 ZIP

```typescript
import { zipSkill } from '@agenthub/zip-handler';

const zipBuffer = await zipSkill({
  files: [
    { name: 'SKILL.md', content: '...' },
    { name: 'index.ts', content: '...' }
  ],
  compression: 'DEFLATE'
});
```

### 下载触发

```typescript
import { downloadAsZip } from '@agenthub/zip-handler';

await downloadAsZip({
  files: skillFiles,
  filename: 'my-skill-v1.0.0.zip'
});
```

## API

### unzipSkill(options)

```typescript
interface UnzipOptions {
  zipBuffer: Buffer;
  validate?: boolean;  // 是否验证 SKILL.md
  maxFileSize?: number; // 最大文件大小（默认 10MB）
}
```

### zipSkill(options)

```typescript
interface ZipOptions {
  files: Array<{ name: string; content: string }>;
  compression?: 'STORE' | 'DEFLATE';
  level?: number;  // 压缩级别 0-9
}
```

### downloadAsZip(options)

```typescript
interface DownloadOptions {
  files: Array<{ name: string; content: string }>;
  filename: string;
  onProgress?: (percent: number) => void;
}
```

## 错误处理

```typescript
try {
  const files = await unzipSkill({ zipBuffer });
} catch (error) {
  if (error.code === 'INVALID_ZIP') {
    // ZIP 文件损坏
  } else if (error.code === 'MISSING_SKILL_MD') {
    // 缺少 SKILL.md
  } else if (error.code === 'FILE_TOO_LARGE') {
    // 文件超过限制
  }
}
```
