import { z } from "zod";

export const MAX_SKILL_INITIAL_FILES = 500;

export const skillFileEntrySchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string().optional(),
});

const downloadPolicyEnum = z.enum(["public", "login", "author"]);

export const skillCreateBodySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  registryId: z.string().min(1).max(255).optional(),
  manifestId: z.string().min(1).max(255).optional(),
  description: z.string().min(1),
  author: z.string().min(1).max(100),
  categorySlug: z.string().min(1),
  longDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  supportedProfiles: z.array(z.string()).optional(),
  downloadPolicy: downloadPolicyEnum.optional(),
  /** 来自 ZIP 解析后的初始文件清单，写入 1.0.0 版本 */
  initialFiles: z.array(skillFileEntrySchema).max(MAX_SKILL_INITIAL_FILES).optional(),
});
