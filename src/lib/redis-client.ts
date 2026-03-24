import Redis, { Cluster } from "ioredis";

export type RedisConnection = Redis | Cluster;

let singleton: RedisConnection | null | undefined;

function parseClusterNodes(raw: string): { host: string; port: number }[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((segment) => {
      const colon = segment.lastIndexOf(":");
      if (colon <= 0) {
        throw new Error(`无效的 REDIS_CLUSTER_NODES 项: ${segment}`);
      }
      const host = segment.slice(0, colon);
      const port = Number(segment.slice(colon + 1));
      if (!Number.isFinite(port) || port <= 0) {
        throw new Error(`无效的 REDIS_CLUSTER_NODES 端口: ${segment}`);
      }
      return { host, port };
    });
}

function tlsOptions(): { tls?: Record<string, never> } {
  return process.env.REDIS_TLS === "1" || process.env.REDIS_TLS === "true"
    ? { tls: {} }
    : {};
}

function createConnection(): RedisConnection | null {
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  const clusterRaw = process.env.REDIS_CLUSTER_NODES?.trim();

  if (clusterRaw) {
    const nodes = parseClusterNodes(clusterRaw);
    return new Cluster(nodes, {
      redisOptions: {
        password,
        ...tlsOptions(),
      },
    });
  }

  const host = process.env.REDIS_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.REDIS_PORT ?? 6379);
  const db = Number(process.env.REDIS_DB ?? 0);

  return new Redis({
    host,
    port,
    password,
    db: Number.isFinite(db) ? db : 0,
    ...tlsOptions(),
  });
}

/**
 * 懒加载单例。若未配置 `REDIS_CLUSTER_NODES` 且未配置 `REDIS_HOST`，返回 null（限流回退进程内 Map）。
 * 集群：设置 `REDIS_CLUSTER_NODES=host:port[,host2:port2,...]`（至少一个入口节点即可发现拓扑）。
 * 单机：与 helix-serve 一致 `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB`。
 */
export function getRedis(): RedisConnection | null {
  if (singleton !== undefined) return singleton;
  try {
    singleton = createConnection();
  } catch {
    singleton = null;
  }
  return singleton;
}

/** 测试或热重载场景下重置连接（一般勿在生产调用） */
export function resetRedisForTests(): void {
  if (singleton && singleton !== null) {
    void singleton.quit().catch(() => undefined);
  }
  singleton = undefined;
}
