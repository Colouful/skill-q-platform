import { NextResponse } from "next/server";
import { buildHubSkillMarkdown } from "@/lib/hub-skill-markdown";
import { publicSiteOriginForRequest } from "@/lib/public-site-url";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = publicSiteOriginForRequest(req.url);
  const md = buildHubSkillMarkdown(origin);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
