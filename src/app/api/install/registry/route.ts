import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import {
  buildBrAiSpecExportBundle,
  extractRegistrySnapshot,
} from "@/lib/br-ai-spec-export";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    profile: z.string().optional(),
    ides: z.array(z.string()).optional(),
    scenario_packages: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    rules: z.array(z.string()).optional(),
    customizeRoles: z.boolean().optional(),
    customizeSkills: z.boolean().optional(),
    customizeRules: z.boolean().optional(),
  })
  .default({});

export async function GET() {
  const [scenarios, roles, skills, rules] = await Promise.all([
    prisma.scenarioPackage.findMany({
      where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.roleTemplate.findMany({
      where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.rule.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  const bundle = await buildBrAiSpecExportBundle({
    scenario_packages: scenarios.map((item) => item.slug),
    roles: roles.map((item) => item.slug),
    skills: skills.map((item) => item.slug),
    rules: rules.map((item) => item.slug),
    customizeRoles: true,
    customizeSkills: true,
    customizeRules: true,
  });
  return NextResponse.json(
    {
      manifest: bundle.manifest,
      warnings: bundle.warnings,
      registry: extractRegistrySnapshot(bundle),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(req: Request) {
  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid payload" }, { status: 400 });
  }

  const bundle = await buildBrAiSpecExportBundle(parsed.data);
  return NextResponse.json(
    {
      manifest: bundle.manifest,
      warnings: bundle.warnings,
      registry: extractRegistrySnapshot(bundle),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
