import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForResourceAuthor } from "@/lib/hub-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const fileEntry = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string().optional(),
});

const postBody = z.object({
  version: z.string().min(1).max(20),
  changelog: z.string().optional(),
  files: z.array(fileEntry).default([]),
  downloadUrl: z.string().max(500).nullable().optional(),
  isLatest: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const skill = await prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!skill) {
      return jsonErr("Skill 不存在", 404);
    }

    const versions = await prisma.version.findMany({
      where: { skillId: skill.id },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk(versions);
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const skill = await prisma.skill.findUnique({
      where: { slug },
      select: { id: true, author: true },
    });
    if (!skill) {
      return jsonErr("Skill 不存在", 404);
    }

    assertHubAuthForResourceAuthor(req, skill.author);

    const raw = await req.json();
    const parsed = postBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;
    const ver = b.version.trim();

    const dup = await prisma.version.findUnique({
      where: { skillId_version: { skillId: skill.id, version: ver } },
    });
    if (dup) {
      return jsonErr("该版本号已存在", 400);
    }

    const wantLatest = b.isLatest !== false;

    const created = await prisma.$transaction(async (tx) => {
      if (wantLatest) {
        await tx.version.updateMany({
          where: { skillId: skill.id },
          data: { isLatest: false },
        });
      }

      return tx.version.create({
        data: {
          skillId: skill.id,
          version: ver,
          changelog: b.changelog?.trim() || null,
          files: b.files,
          downloadUrl: b.downloadUrl?.trim() || null,
          isLatest: wantLatest,
        },
      });
    });

    return jsonOk(created, "版本已创建");
  } catch (e) {
    return toApiResponse(e);
  }
}
