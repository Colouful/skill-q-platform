import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBrAiSpecExportZip } from "@/lib/br-ai-spec-export";
import { buildInstallPreview } from "@/lib/install-preview";
import { publicSiteOriginForRequest } from "@/lib/public-site-url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  format: z.enum(["manifest", "br-ai-spec-zip"]).optional(),
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
  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid payload" }, { status: 400 });
  }

  const { format = "manifest", ...installInput } = parsed.data;
  if (format === "br-ai-spec-zip") {
    const bundle = await buildBrAiSpecExportZip(installInput);
    const filename = "br-ai-spec-export.zip";
    const body = Buffer.from(bundle.bytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(body.length),
        "Cache-Control": "no-store",
      },
    });
  }

  const preview = await buildInstallPreview(installInput, publicSiteOriginForRequest(req.url));

  return NextResponse.json(preview.manifest, {
    headers: {
      "Content-Disposition": 'attachment; filename="manifest.json"',
      "Cache-Control": "no-store",
    },
  });
}
