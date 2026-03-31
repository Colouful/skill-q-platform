import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { checkApiRateLimit, getRequestIp } from "@/lib/api-rate-limit";
import { prisma } from "@/lib/prisma";
import {
  importRuleMarkdownFile,
  importRuleZip,
  type RuleZipImportResult,
} from "@/lib/rule-zip-import";
import {
  importRoleMarkdownFile,
  importRoleZip,
  type RoleImportResult,
} from "@/lib/role-import";
import {
  importSkillFolderFromBrowserFiles,
  importSkillZip,
  type SkillZipImportResult,
} from "@/lib/skill-zip-import";
import { isMinioConfigured, storeSkillZipArchive } from "@/lib/minio";

export const dynamic = "force-dynamic";

/** 13.1 上传 Skill 包（ZIP），13.3–13.6 解压、校验与启发式安全扫描；可选 MinIO 归档原始包 */
export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const rl = await checkApiRateLimit(`api:upload:${ip}`, { max: 40, windowMs: 60_000 });
    if (!rl.ok) {
      return jsonErr("上传过于频繁，请稍后再试", 429);
    }

    const form = await req.formData();
    const kind = String(form.get("kind") ?? "skill").toLowerCase();
    const mode = String(form.get("mode") ?? "zip").toLowerCase();

    let result: SkillZipImportResult | RuleZipImportResult | RoleImportResult;
    let objectStorage:
      | { stored: true; bucket: string; objectKey: string; size: number }
      | { stored: false; reason: "disabled" | "error"; message?: string } = {
      stored: false,
      reason: "disabled",
    };

    if (mode === "folder") {
      if (kind === "rule" || kind === "role") {
        return jsonErr(`${kind === "rule" ? "Rule" : "专家"} 请使用单文件 .md 或 ZIP 上传（不支持文件夹模式）`, 400);
      }
      const files = form.getAll("files").filter((v): v is File => v instanceof File);
      if (files.length === 0) {
        return jsonErr("请选择文件夹（mode=folder 时须提交 files 字段）", 400);
      }
      result = await importSkillFolderFromBrowserFiles(files);
    } else {
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return jsonErr("请使用 multipart 上传 file 字段（Skill 为 ZIP；Rule / 专家 可为 .md 或 ZIP），或 mode=folder 多文件上传", 400);
      }
      const buf = await file.arrayBuffer();
      const originalName = file instanceof File ? file.name : "upload.zip";
      const lowerName = originalName.toLowerCase();
      if (kind === "rule") {
        if (lowerName.endsWith(".md")) {
          result = importRuleMarkdownFile(buf, originalName);
        } else if (lowerName.endsWith(".zip")) {
          result = await importRuleZip(buf);
        } else {
          return jsonErr("Rule 请上传 .md 或 .zip 文件", 400);
        }
      } else if (kind === "role") {
        if (lowerName.endsWith(".md")) {
          result = importRoleMarkdownFile(buf, originalName);
        } else if (lowerName.endsWith(".zip")) {
          result = await importRoleZip(buf);
        } else {
          return jsonErr("专家请上传 .md 或 .zip 文件", 400);
        }
      } else {
        result = await importSkillZip(buf);
      }

      if (isMinioConfigured() && lowerName.endsWith(".zip")) {
        try {
          const meta = await storeSkillZipArchive(buf, originalName);
          objectStorage = {
            stored: true,
            bucket: meta.bucket,
            objectKey: meta.objectKey,
            size: meta.size,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[upload] MinIO 归档失败:", message);
          objectStorage = { stored: false, reason: "error", message };
        }
      }
    }

    if (kind === "role") {
      const roleResult = result as RoleImportResult;
      const matchedDomains =
        roleResult.roleData.domains.length > 0
          ? await prisma.capabilityDomain.findMany({
              where: {
                slug: {
                  in: roleResult.roleData.domains,
                },
              },
              select: { id: true, slug: true },
            })
          : [];
      const matchedSlugSet = new Set(matchedDomains.map((item) => item.slug));
      const unmatchedDomains = roleResult.roleData.domains.filter((slug) => !matchedSlugSet.has(slug));
      const issues = [...roleResult.issues];
      if (unmatchedDomains.length > 0) {
        issues.push(`以下能力域未匹配到 Hub 字典，请手动补选：${unmatchedDomains.join(" / ")}`);
      }
      if (roleResult.ignoredMetaKeys.length > 0) {
        issues.push(`已忽略未识别的 frontmatter 字段：${roleResult.ignoredMetaKeys.join(", ")}`);
      }

      return jsonOk(
        {
          ...roleResult,
          mappedDomainIds: matchedDomains.map((item) => item.id),
          unmatchedDomains,
          issues,
          objectStorage,
        },
        "解析完成",
      );
    }

    return jsonOk({ ...result, objectStorage }, "解析完成");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "解析失败";
    if (msg.includes("超过") || msg.includes("Zip")) {
      return jsonErr(msg, 400);
    }
    return toApiResponse(e);
  }
}
