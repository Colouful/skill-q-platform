import { z } from "zod";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { buildInstallPreview } from "@/lib/install-preview";
import { publicSiteOriginForRequest } from "@/lib/public-site-url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  profile: z.string().optional(),
  ides: z.array(z.string()).optional(),
  scenario_packages: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
  customizeRoles: z.boolean().optional(),
  customizeSkills: z.boolean().optional(),
  customizeRules: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const preview = await buildInstallPreview(
      parsed.data,
      publicSiteOriginForRequest(req.url),
    );

    return jsonOk(preview);
  } catch (e) {
    return toApiResponse(e);
  }
}
