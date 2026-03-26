import type { ZipImportFile } from "@/lib/rule-zip-import";
import {
  isMarkdownFilenamePath,
  isRuleManifestPath,
  isRulePrimaryMarkdownPath,
} from "@/lib/rule-manifest-path";

export type RulePackageValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/** 校验待提交的 Rule 初始文件列表（与 POST /api/rules 的 initialFiles 一致） */
export function validateRulePackage(files: ZipImportFile[] | null | undefined): RulePackageValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!files || files.length === 0) {
    return { ok: true, errors, warnings };
  }

  const hasRuleMd = files.some((f) => isRulePrimaryMarkdownPath(f.path));
  if (!hasRuleMd) {
    errors.push("包中须包含至少一个 .md 文件作为主说明（任意文件名即可；RULE.md / RULE.md.txt 仍受支持）");
  }

  const hasManifest = files.some((f) => isRuleManifestPath(f.path));
  const mdBasics = files.filter((f) => isMarkdownFilenamePath(f.path));
  if (!hasManifest && mdBasics.length > 1) {
    errors.push("存在多个 .md 文件时，请将主说明命名为 RULE.md / rule.md（或 RULE.md.txt）");
  }

  const hasRuleLike = files.some((f) => {
    const p = f.path.toLowerCase();
    return (
      p.endsWith(".json") ||
      p.endsWith(".yaml") ||
      p.endsWith(".yml") ||
      p.endsWith(".toml")
    );
  });
  if (!hasRuleLike) {
    warnings.push("未发现 .json / .yaml / .yml / .toml 规则文件，若仅有文档也可继续");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
