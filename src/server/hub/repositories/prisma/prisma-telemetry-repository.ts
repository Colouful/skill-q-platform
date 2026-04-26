import type { TelemetryRepositoryPort } from "../ports/telemetry-repository-port";
import type { InstallRecordListQuery, PrismaHubClientLike, RuntimeFeedbackListQuery } from "../repository-types";
import { parsePagination } from "../repository-types";
import { mapPrismaInstallRecordSummary, mapPrismaRuntimeFeedbackSummary } from "./prisma-mappers";

export class PrismaTelemetryRepository implements TelemetryRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async listInstallRecords(query: InstallRecordListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const where = {
      ...(query.manifestSlug ? { manifestSlug: { contains: query.manifestSlug } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.hubInstallRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.hubInstallRecord.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaInstallRecordSummary),
      pagination: { page, pageSize, total },
    };
  }

  async listRuntimeFeedback(query: RuntimeFeedbackListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const success = typeof query.success === "boolean" ? query.success : query.success === "true" ? true : query.success === "false" ? false : undefined;
    const where = {
      ...(query.manifestSlug ? { manifestSlug: { contains: query.manifestSlug } } : {}),
      ...(success === undefined ? {} : { success }),
      ...(query.executorType ? { executorType: query.executorType } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.hubRuntimeFeedback.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.hubRuntimeFeedback.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaRuntimeFeedbackSummary),
      pagination: { page, pageSize, total },
    };
  }
}
