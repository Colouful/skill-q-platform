import type { ZipImportFile } from "@/lib/rule-zip-import";
import { isRuleManifestPath } from "@/lib/rule-manifest-path";

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

  const hasRuleMd = files.some((f) => isRuleManifestPath(f.path));
  if (!hasRuleMd) {
    errors.push("ZIP 中须包含 RULE.md 或 RULE.md.txt（可在子目录；大小写不敏感）");
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
