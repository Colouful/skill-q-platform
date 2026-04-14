import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBrAiSpecExportZip } from "@/lib/br-ai-spec-export";
import { resolveSupplementExportSelection } from "@/lib/install-supplement";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  profile: z.string().optional(),
  ides: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

function hasMissingAssets(missing: {
  roles: string[];
  skills: string[];
  rules: string[];
}): boolean {
  return missing.roles.length > 0 || missing.skills.length > 0 || missing.rules.length > 0;
}

export async function POST(req: Request) {
  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid payload" }, { status: 400 });
  }

  const selection = await resolveSupplementExportSelection(parsed.data);
  if (hasMissingAssets(selection.missing)) {
    return NextResponse.json(
      {
        message: "canonical assets not found or not published",
        missing: selection.missing,
      },
      { status: 404 },
    );
  }

  const bundle = await buildBrAiSpecExportZip({
    profile: parsed.data.profile,
    ides: parsed.data.ides,
    roles: selection.roles,
    skills: selection.skills,
    rules: selection.rules,
  });
  const filename = "br-ai-spec-supplement.zip";
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
