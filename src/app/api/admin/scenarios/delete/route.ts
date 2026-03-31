import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
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

    await prisma.scenarioPackage.delete({
      where: { id: parsed.data.id },
    });

    return jsonOk({ id: parsed.data.id }, "已删除");
  } catch (e) {
    return toApiResponse(e);
  }
}
