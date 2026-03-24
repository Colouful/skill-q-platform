import { NextResponse } from "next/server";
import { buildHubSkillMarkdown } from "@/lib/hub-skill-markdown";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const md = buildHubSkillMarkdown(origin);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
