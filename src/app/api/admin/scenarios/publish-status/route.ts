import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
  publishStatus: z.enum(["draft", "published"]),
});

export async function POST(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const scenario = await prisma.scenarioPackage.update({
      where: { id: parsed.data.id },
      data: { publishStatus: parsed.data.publishStatus },
      select: { id: true, publishStatus: true },
    });

    return jsonOk({ scenario }, "状态已更新");
  } catch (e) {
    return toApiResponse(e);
  }
}
