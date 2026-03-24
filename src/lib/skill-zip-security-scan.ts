import type { ZipImportFile } from "@/lib/skill-zip-import";

const CODE_LIKE = /\.(js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|fish|ps1)$/i;

/** 启发式风险片段（13.6：轻量扫描；深度规则可对接 agent-skills-tools） */
const RISK_PATTERNS: { re: RegExp; note: string }[] = [
  { re: /\bchild_process\b/, note: "疑似引用 child_process" },
  { re: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, note: "疑似加载 child_process" },
  { re: /\bimport\s*\(\s*['"]child_process['"]\s*\)/, note: "疑似动态加载 child_process" },
  { re: /\b(?:execSync|execFileSync|spawnSync)\s*\(/, note: "疑似同步执行命令" },
  { re: /\beval\s*\(/, note: "疑似使用 eval" },
  { re: /\bnew\s+Function\s*\(/, note: "疑似动态 Function 构造" },
  { re: /\bprocess\.mainModule\b/, note: "疑似访问 process.mainModule" },
];

/**
 * 对解压后的文本类文件做快速扫描，返回可读告警（不阻断导入，由前端展示）。
 */
export function scanSkillZipForRiskPatterns(files: ZipImportFile[]): string[] {
  const issues: string[] = [];
  for (const f of files) {
    if (!CODE_LIKE.test(f.path)) continue;
    const lines = f.content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { re, note } of RISK_PATTERNS) {
        if (re.test(line)) {
          issues.push(`${f.path}:${i + 1} ${note}`);
          break;
        }
      }
    }
  }
  return issues;
}
